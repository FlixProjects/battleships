import { SUPPORTS_CONFIG, TSupportRefNo } from "../constants";
import {
    ActionTypes,
    ICard,
    IMEvent,
    IMEventType,
    IPlainCard,
    IPlaySupportAction,
    ISupportCardPayload,
    PlaySupportConfirmIMEvent,
    PlaySupportTargetIMEvent as PlaySupportTargetIMEvent,
    TActionMeta,
    TPlayCardPayload,
} from "../types";
import { Card, ICardSelectionHandlers } from "./Card";

/**
 * Card that triggers an `IPlaySupportAction`. The `refNo` keys into
 * `SUPPORTS_CONFIG`; the first Effect's `range` decides whether the player
 * needs to pick a target tile or just confirm.
 */
export class SupportCard extends Card {
    constructor(props: Readonly<ICard>) {
        super(props);
    }

    public buildAction(meta: TActionMeta, payload: TPlayCardPayload): IPlaySupportAction {
        if (payload.kind !== "Support") {
            throw new Error(
                `SupportCard ${this.id} received non-Support payload (kind=${payload.kind}); cannot build support action`,
            );
        }
        const supportPayload = payload as ISupportCardPayload;
        return {
            ...meta,
            type: ActionTypes.SUPPORT,
            cardId: this.id,
            supportRefNo: this.refNo,
            targetCell: supportPayload.targetCell,
        };
    }

    public getSelectionEvent(handlers: ICardSelectionHandlers): IMEvent {
        const config = SUPPORTS_CONFIG[this.refNo as TSupportRefNo];
        if (!config) {
            throw new Error(`SupportCard ${this.id} has unknown refNo '${this.refNo}'`);
        }
        const firstEffect = config.effects[0];
        if (!firstEffect) {
            throw new Error(`SupportCard ${this.id} has no Effects configured`);
        }

        if (firstEffect.range > 0) {
            const event: PlaySupportTargetIMEvent = {
                type: IMEventType.PLAY_SUPPORT_TARGET,
                cardId: this.id,
                effectIndex: 0,
                ...handlers,
            };
            return event;
        }

        const event: PlaySupportConfirmIMEvent = {
            type: IMEventType.PLAY_SUPPORT_CONFIRM,
            cardId: this.id,
            effectIndex: 0,
            ...handlers,
        };
        return event;
    }

    public static toDomain(plain: IPlainCard): SupportCard {
        return new SupportCard(plain);
    }
}
