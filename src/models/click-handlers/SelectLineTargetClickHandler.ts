import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { ICellLoc, IMEventType, LineOrientation } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { Selectable } from "../../components/Selectable";
import { queueCommand } from "../../utils/game-helper";
import { SelectRouteClickHandler } from "./SelectRouteClickHandler";
import { SelectTargetClickHandler } from "./SelectTargetClickHandler";

/**
 * Line-targeted Support flow (Airstrike). Reuses SelectTargetClickHandler to
 * pick a visible center tile, then hands off to the route-picker overlay to
 * toggle the 3-tile line between horizontal and vertical before playing the
 * card with the chosen orientation.
 */
export class SelectLineTargetClickHandler extends SelectTargetClickHandler {
    protected async onCenterSelected(targetCell: ICellLoc, tile: Selectable) {
        const { onGlobalDeselect, onSuccessfulSelect } = this.event;
        const boardConfig = gameManager.state.gameState.getBoardDimensions();

        const horizontal = this.buildLine(targetCell, "horizontal", boardConfig);
        const vertical = this.buildLine(targetCell, "vertical", boardConfig);

        // Detach the tile-click listener so subsequent clicks go to the PathMenu.
        this.removeGlobalClickEventListener();

        const routeHandler = new SelectRouteClickHandler({
            routes: [horizontal, vertical],
            onConfirm: async (selectedRoute) => {
                const orientation = selectedRoute === vertical ? LineOrientation.Vertical : LineOrientation.Horizontal;
                const playerId = gameManager.getCurrentPlayerId();
                await queueCommand(
                    new FEPlayCardCommand({
                        cardId: this.event.cardId,
                        playerId,
                        loadPlayParams: { kind: "Support", targetCell, orientation },
                        locationElement: tile,
                        onSuccessCb: onSuccessfulSelect,
                    }),
                );
            },
            onBack: () => {
                interactionManager.handleEvent({
                    type: IMEventType.PLAY_SUPPORT_LINE,
                    cardId: this.event.cardId,
                    effectIndex: this.event.effectIndex,
                    onGlobalDeselect,
                    onSuccessfulSelect,
                });
            },
            onDismiss: () => onGlobalDeselect?.(),
            boardConfig,
        });
        routeHandler.start();
    }

    /** center ± 1 along the axis, dropping tiles that fall off the board. */
    private buildLine(
        center: ICellLoc,
        orientation: "horizontal" | "vertical",
        { rows, cols }: { rows: number; cols: number },
    ): ICellLoc[] {
        const [cx, cy] = center;
        const offsets: ICellLoc[] =
            orientation === "vertical"
                ? [
                      [0, -1],
                      [0, 0],
                      [0, 1],
                  ]
                : [
                      [-1, 0],
                      [0, 0],
                      [1, 0],
                  ];

        return offsets
            .map(([dx, dy]) => [cx + dx, cy + dy] as ICellLoc)
            .filter(([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows);
    }
}
