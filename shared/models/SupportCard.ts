import { EFFECTS_CONFIG, SUPPORTS_CONFIG } from "../config/constants";
import {
    ICard,
    IEffectConfig,
    IGameState,
    IMEvent,
    IMEventType,
    IPlainCard,
    IPlayCardSignalHandleCtx,
    ISupportCardPayload,
    PlaySupportConfirmIMEvent,
    PlaySupportTargetIMEvent,
    TEffectRefNo,
    TSupportRefNo,
} from "../types";
import { buildEffect } from "../utils/effect-helper";
import { Card, ICardSelectionHandlers } from "./Card";
import { DeckAddToPlayedSignal } from "./signals/DeckAddToPlayedSignal";
import { GameStateCreateEffectSignal } from "./signals/GameStateCreateEffectSignal";
import { PlayerRemoveCardFromHandSignal } from "./signals/PlayerRemoveCardFromHandSignal";
import { PlayerSpendCommandPointsSignal } from "./signals/PlayerSpendCommandPointsSignal";

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

    public play(ctx: IPlayCardSignalHandleCtx): IGameState {
        const { gsm, signal, emitter } = ctx;
        const { playerId, cardPayload } = signal.payload;

        if (cardPayload.kind !== "Support") {
            throw new Error(`SupportCard ${this.id} received non-Support payload (kind=${cardPayload.kind}); cannot play`);
        }
        const { targetCell } = cardPayload as ISupportCardPayload;
        const currentRound = gsm.gameState.currentRound;

        this.effects.forEach((effectConfig) => {
            const effect = buildEffect({ effectConfig, playerId, cardId: this.id, targetCell, currentRound });

            // Immediate on-play impact — emits its own signals (no-op for passive vision).
            effect.resolve(ctx);

            // Effects with a lifetime are born into the world (GameState owns the collection).
            if (effectConfig.duration > 0) {
                emitter([
                    new GameStateCreateEffectSignal({
                        senderId: this.id,
                        originId: signal.id,
                        payload: { effect: effect.toPlain() },
                    }),
                ]);
            }
        });

        emitter([
            new PlayerSpendCommandPointsSignal({
                targetId: playerId,
                senderId: this.id,
                originId: signal.id,
                payload: { playerId, amount: this.commandPointCost },
            }),
            // Card lifecycle — same as ShipCard: Player owns the hand, Deck owns the played pile.
            new PlayerRemoveCardFromHandSignal({
                targetId: playerId,
                senderId: this.id,
                originId: signal.id,
                payload: { playerId, cardId: this.id },
            }),
            new DeckAddToPlayedSignal({
                targetId: this.deckId,
                senderId: this.id,
                originId: signal.id,
                payload: { deckId: this.deckId, cardId: this.id },
            }),
        ]);

        return gsm.gameState;
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
