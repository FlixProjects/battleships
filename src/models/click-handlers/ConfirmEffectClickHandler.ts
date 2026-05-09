import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { SupportCard } from "@shared/models";
import { PlaySupportConfirmIMEvent } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { Toast } from "../../components/Toast";
import { queueCommand } from "../../utils/game-helper";
import { FEEffect } from "../effects";
import { ClickHandler } from "./ClickHandler";

/**
 * Generic ClickHandler for SupportCard Effects that don't require a target —
 * the player just confirms playing the card. Surfaced as a Toast prompt;
 * a click on the prompt commits, any other click cancels.
 */
export class ConfirmEffectClickHandler extends ClickHandler {
    private toastId = `support-confirm-${Math.random().toString(36).slice(2)}`;

    constructor(protected event: PlaySupportConfirmIMEvent) {
        super();
    }

    public handleEvent() {
        const card = this.getCard();
        const name = card?.name ?? "Support";
        Toast.show({ message: `Click to confirm: play ${name}`, type: "info", permanent: true }, this.toastId);

        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        const { onGlobalDeselect, onSuccessfulSelect } = this.event;
        const target = e.target as HTMLElement;
        const isToastClick = !!target.closest(`#${CSS.escape(this.toastId)}`);

        document.getElementById(this.toastId)?.remove();

        if (!isToastClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        if (this.hasMoreEffects()) {
            this.dispatchNextEffect();
            return;
        }

        const playerId = gameManager.getCurrentPlayerId();
        queueCommand(
            new FEPlayCardCommand({
                cardId: this.event.cardId,
                playerId,
                support: {},
                onSuccessCb: onSuccessfulSelect,
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
        return this.event.effectIndex + 1 < card.effects.length;
    }

    private dispatchNextEffect() {
        const card = this.getCard();
        if (!card) return;
        const nextIndex = this.event.effectIndex + 1;
        const nextEffectConfig = card.effects[nextIndex];
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
