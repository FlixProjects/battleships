import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { GetValidSupportCellsSignal } from "@shared/models/signals/GetValidSupportCellsSignal";
import { SupportCard } from "@shared/models";
import { ICellLoc, PlaySupportTargetIMEvent } from "@shared/types";
import { keyToLocation, locationToKey } from "@shared/utils/helpers";
import { gameManager, interactionManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { Selectable } from "../../components/Selectable";
import { Toast } from "../../components/Toast";
import { getEngine, queueCommand } from "../../utils/game-helper";
import { FEEffect } from "../effects";
import { ClickHandler } from "./ClickHandler";

/**
 * Generic ClickHandler for SupportCard Effects that need a target tile (Flare,
 * future single-tile damage cards, etc.). Highlights the Effect's anchored
 * range and, on a valid click, either chains to the next FEEffect (multi-
 * effect cards) or dispatches FEPlayCardCommand.
 *
 * The click is resolved against the closest `.tile` element so a click that
 * lands on a hull image inside a tile still selects the underlying tile.
 */
export class SelectTargetClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];

    constructor(protected event: PlaySupportTargetIMEvent) {
        super();
    }

    public handleEvent() {
        const { cardId, effectIndex } = this.event;
        const playerId = gameManager.getCurrentPlayerId();

        const result = getEngine().query(
            new GetValidSupportCellsSignal({ targetId: cardId, payload: { cardId, playerId, effectIndex } }),
        );

        this.validCells = result?.validCells ?? [];
        this.announceCurrentEffect();
        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, this.validCells));

        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        const { onGlobalDeselect } = this.event;
        const target = e.target as HTMLElement;

        // Resolve the underlying tile even when a hull sprite (static layer,
        // not a child of the tile) covers it. A primed Support target takes
        // precedence over hull/ship handlers — the tile underneath wins.
        const tileId = this.getTileIdAtPoint(e);
        const clickedCardRow = target.closest(".card-row");
        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        if (!tileId && !clickedCardRow) {
            return this.handleInvalidClick(onGlobalDeselect);
        }
        if (clickedCardRow && !validCellIndices.includes(tileId)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }
        if (!validCellIndices.includes(tileId)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        const tile = this.selectables[tileId];
        const targetCell = keyToLocation(tileId);

        if (this.hasMoreEffects()) {
            this.dispatchNextEffect();
            return;
        }

        await this.onCenterSelected(targetCell, tile);
    }

    /**
     * Final step once a valid target tile is picked. The default plays the card
     * immediately; subclasses (line-targeted supports) override to insert an
     * extra selection step before dispatching FEPlayCardCommand.
     */
    protected async onCenterSelected(targetCell: ICellLoc, tile: Selectable) {
        const playerId = gameManager.getCurrentPlayerId();
        queueCommand(
            new FEPlayCardCommand({
                cardId: this.event.cardId,
                playerId,
                loadPlayParams: { kind: "Support", targetCell },
                locationElement: tile,
                onSuccessCb: this.event.onSuccessfulSelect,
            }),
        );
    }

    private getCard(): SupportCard | undefined {
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        return card instanceof SupportCard ? card : undefined;
    }

    private hasMoreEffects(): boolean {
        const card = this.getCard();
        if (!card) return false;
        return this.event.effectIndex + 1 < card.effectTemplates.length;
    }

    private dispatchNextEffect() {
        const card = this.getCard();
        if (!card) return;
        const nextIndex = this.event.effectIndex + 1;
        const nextEffectConfig = card.effectTemplates[nextIndex];
        if (!nextEffectConfig) return;

        const nextFEEffect = new FEEffect(card.id, nextIndex, nextEffectConfig);
        interactionManager.handleEvent(
            nextFEEffect.getSelectionEvent({
                onGlobalDeselect: this.event.onGlobalDeselect,
                onSuccessfulSelect: this.event.onSuccessfulSelect,
            }),
        );
    }

    private announceCurrentEffect() {
        const card = this.getCard();
        if (!card || card.effectTemplates.length <= 1) return;
        const effectConfig = card.effectTemplates[this.event.effectIndex];
        if (!effectConfig) return;
        Toast.show({
            message: `${card.name}: pick a tile for "${effectConfig.refNo}"`,
            type: "info",
            duration: 2500,
        });
    }
}
