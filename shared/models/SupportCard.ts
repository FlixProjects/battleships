import { EFFECTS_CONFIG, SUPPORTS_CONFIG, TEffectRefNo, TSupportRefNo } from "../constants";
import {
    ActionTypes,
    ICard,
    IEffectConfig,
    IMEvent,
    IMEventType,
    IPlainCard,
    IPlaySupportAction,
    ISupportCardPayload,
    PlaySupportConfirmIMEvent,
    PlaySupportTargetIMEvent,
    TActionMeta,
    TPlayCardPayload,
} from "../types";
import { Card, ICardSelectionHandlers } from "./Card";

export class SupportCard extends Card {
    public readonly name: string;
    public readonly commandPointCost: number;
    public readonly effects: IEffectConfig[];

    constructor(props: Readonly<ICard>) {
        super(props);
        const supportConfig = SUPPORTS_CONFIG[props.refNo as TSupportRefNo];
        if (!supportConfig) {
            throw new Error(`SupportCard ${props.id} has unknown refNo '${props.refNo}'`);
        }
        this.name = supportConfig.name;
        this.commandPointCost = supportConfig.commandPointCost;
        this.effects = supportConfig.effects.map((effectRefNo) => {
            const effectConfig = EFFECTS_CONFIG[effectRefNo as TEffectRefNo];
            if (!effectConfig) {
                throw new Error(`SupportCard ${props.id} references unknown Effect refNo '${effectRefNo}'`);
            }
            return effectConfig;
        });
        if (this.effects.length === 0) {
            throw new Error(`SupportCard ${props.id} has no Effects configured`);
        }
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
        const firstEffect = this.effects[0];

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
