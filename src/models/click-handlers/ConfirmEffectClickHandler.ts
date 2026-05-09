import { SUPPORTS_CONFIG, TSupportRefNo } from "@shared/constants";
import { FEPlayCardCommand } from "@shared/models/commands/FEPlayCardCommand";
import { PlaySupportConfirmIMEvent } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { Toast } from "../../components/Toast";
import { queueCommand } from "../../utils/game-helper";
import { buildFEEffects } from "../effects";
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
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        const supportConfig = card ? SUPPORTS_CONFIG[card.refNo as TSupportRefNo] : undefined;
        const name = supportConfig?.name ?? "Support";
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

    private hasMoreEffects(): boolean {
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        if (!card) return false;
        const supportConfig = SUPPORTS_CONFIG[card.refNo as TSupportRefNo];
        return !!supportConfig && this.event.effectIndex + 1 < supportConfig.effects.length;
    }

    private dispatchNextEffect() {
        const nextIndex = this.event.effectIndex + 1;
        const card = gameManager.state.gameState.cards.find((c) => c.id === this.event.cardId);
        if (!card) return;
        const feEffects = buildFEEffects(card.id, card.refNo);
        const nextFEEffect = feEffects[nextIndex];
        if (!nextFEEffect) return;

        interactionManager.handleEvent(
            nextFEEffect.getSelectionEvent({
                onGlobalDeselect: this.event.onGlobalDeselect,
                onSuccessfulSelect: this.event.onSuccessfulSelect,
            }),
        );
    }
}
