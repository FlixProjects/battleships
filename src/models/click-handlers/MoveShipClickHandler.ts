import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEMoveShipCommand } from "@shared/models/commands/FEMoveShipCommand";
import { GetValidMoveCellsSignal } from "@shared/models/signals/GetValidMoveCellsSignal";
import { GetValidMoveRoutesSignal } from "@shared/models/signals/GetValidMoveRoutesSignal";
import { ICellLoc } from "@shared/types";
import { locationToKey } from "@shared/utils";
import { gameManager, interactionManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { getEngine, queueCommand } from "../../utils/game-helper";
import { IMEventType, MovingShipIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";
import { SelectRouteClickHandler } from "./SelectRouteClickHandler";

export class MoveShipClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    private origin: ICellLoc;

    constructor(protected event: MovingShipIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getCurrentPlayerId();

        const result = getEngine().query(
            new GetValidMoveCellsSignal({ targetId: shipId, payload: { shipId, playerId } }),
        );
        const validCells = result?.validCells ?? [];

        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, validCells));
        this.validCells = validCells;
        this.origin = result?.origin ?? this.origin;

        return {
            nextClickhandler: async (e: MouseEvent) => await this.handler(e),
        };
    }

    protected async handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;

        const id = target.closest(`.tile`)?.id;
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        const isInvalidClick =
            !id || (!validCellIndices.includes(id) && !(this.origin && locationToKey(this.origin) === id));

        if (isInvalidClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            await this.handleValidMoveShipClick(id, shipId, onSuccessfulSelect);
        }
    }

    private async handleValidMoveShipClick(destinationTileId: string, shipId: string, onSuccessCb?: () => void) {
        const playerId = gameManager.getCurrentPlayerId();
        const tile = this.selectables[destinationTileId];
        const gameState = gameManager.state.gameState;
        const routesResult = getEngine().query(
            new GetValidMoveRoutesSignal({ targetId: shipId, payload: { shipId, playerId, destinationTileId } }),
        );
        const routes = routesResult?.routes ?? [];

        if (routes.length === 0) return;

        // Hand off to route selection: detach the global tile-click listener
        // so subsequent clicks go to the PathMenu's outside-click handler instead.
        this.removeGlobalClickEventListener();
        const boardConfig = gameState.getBoardDimensions();
        const routeHandler = new SelectRouteClickHandler({
            routes,
            onConfirm: async (selectedRoute) => {
                await queueCommand(
                    new FEMoveShipCommand({
                        tileId: destinationTileId,
                        shipId,
                        playerId,
                        locationElement: tile,
                        onSuccessCb,
                        route: selectedRoute,
                    }),
                );
            },
            onBack: () => {
                interactionManager.handleEvent({
                    type: IMEventType.MOVING_SHIP,
                    shipId,
                    onGlobalDeselect: this.event.onGlobalDeselect,
                    onSuccessfulSelect: this.event.onSuccessfulSelect,
                });
            },
            onDismiss: () => {
                this.event.onGlobalDeselect?.();
            },
            boardConfig,
        });
        routeHandler.start();
    }
}
