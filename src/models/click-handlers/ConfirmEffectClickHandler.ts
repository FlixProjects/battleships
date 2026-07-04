import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { SupportCard } from "@shared/models";
import { GAME_BOARD_ID } from "@shared/constants";
import { ICellLoc, PlaySupportConfirmIMEvent } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { getComponents, updateComponents } from "../../components/component-helper";
import { Toast } from "../../components/Toast";
import { queueCommand } from "../../utils/game-helper";
import { FEEffect } from "../effects";
import { ClickHandler } from "./ClickHandler";

/**
 * Generic ClickHandler for SupportCard Effects that don't require a target —
 * the player just confirms playing the card. The whole game board is
 * highlighted and any click on it commits; a click anywhere else cancels.
 */
export class ConfirmEffectClickHandler extends ClickHandler {
    constructor(protected event: PlaySupportConfirmIMEvent) {
        super();
    }

    public handleEvent() {
        const card = this.getCard();
        const name = card?.name ?? "Support";
        Toast.show({ message: `Click the board to play ${name}`, type: "info", duration: 2500 });
        queueCommand(new FEHighlightLocationsCommand(getComponents().div.gameBoard, this.allBoardCells()));

        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        const { onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;
        const isBoardClick = !!target.closest(`#${CSS.escape(GAME_BOARD_ID)}`);

        if (!isBoardClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        if (this.hasMoreEffects()) {
            this.dispatchNextEffect();
            return;
        }

        const playerId = gameManager.getCurrentPlayerId();
        // No target tile to drive teardown (unlike SelectTargetClickHandler, which
        // relies on the clicked tile's runOnSelects). Finalize explicitly: re-render,
        // clear the card selection, and detach the global click listener.
        queueCommand(
            new FEPlayCardCommand({
                cardId: this.event.cardId,
                playerId,
                loadPlayParams: { kind: "Support" },
                onSuccessCb: () => {
                    updateComponents();
                    onGlobalDeselect?.();
                    onSuccessfulSelect?.();
                    this.removeGlobalClickEventListener();
                },
            }),
        );
    }

    /** Every cell on the board — the whole grid is a valid confirm target. */
    private allBoardCells(): ICellLoc[] {
        const { rows, cols } = gameManager.state.gameState.getBoardDimensions();
        const cells: ICellLoc[] = [];
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                cells.push([x, y]);
            }
        }
        return cells;
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
}
