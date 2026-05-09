import {
    IEffectConfig,
    IMEvent,
    IMEventType,
    PlaySupportConfirmIMEvent,
    PlaySupportTargetIMEvent,
} from "@shared/types";
import { ICardSelectionHandlers } from "@shared/models/Card";

/**
 * FE-augmented Effect — a per-Effect descriptor on the frontend that knows
 * which IM event (and therefore which ClickHandler) to mount when the user
 * starts playing a SupportCard.
 *
 * For multi-Effect SupportCards, each Effect's IM event is dispatched in turn
 * by chaining onSuccessfulSelect: when the player completes one Effect's
 * selection, the next FEEffect's event is dispatched.
 */
export class FEEffect {
    constructor(
        public readonly cardId: string,
        public readonly effectIndex: number,
        public readonly config: IEffectConfig,
    ) {}

    public getSelectionEvent(handlers: ICardSelectionHandlers): IMEvent {
        if (this.config.range > 0) {
            const event: PlaySupportTargetIMEvent = {
                type: IMEventType.PLAY_SUPPORT_TARGET,
                cardId: this.cardId,
                effectIndex: this.effectIndex,
                ...handlers,
            };
            return event;
        }

        const event: PlaySupportConfirmIMEvent = {
            type: IMEventType.PLAY_SUPPORT_CONFIRM,
            cardId: this.cardId,
            effectIndex: this.effectIndex,
            ...handlers,
        };
        return event;
    }
}
