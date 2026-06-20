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
} from "../types";
import { Card, ICardSelectionHandlers } from "./Card";
import { DeckAddToPlayedSignal } from "./signals/DeckAddToPlayedSignal";
import { GameActivateEffectSignal } from "./signals/GameActivateEffectSignal";
import { PlayerRemoveCardFromHandSignal } from "./signals/PlayerRemoveCardFromHandSignal";
import { PlayerSpendCommandPointsSignal } from "./signals/PlayerSpendCommandPointsSignal";

export class SupportCard extends Card {
    public readonly description: string;
    public readonly commandPointCost: number;
    public readonly effects: IEffectConfig[];

    constructor(props: Readonly<ICard>) {
        super(props);
        // Resolved data is persisted on the card at creation (buildPlayerStartingState).
        // Never re-derive from SUPPORTS_CONFIG / EFFECTS_CONFIG here. `name` lives
        // on the Card base.
        this.description = props.description ?? "";
        this.commandPointCost = props.commandPointCost ?? 0;
        this.effects = props.effects ?? [];
    }

    public play(ctx: IPlayCardSignalHandleCtx): IGameState {
        const { gsm, signal, emitter } = ctx;
        const { playerId, cardPayload } = signal.payload;

        if (cardPayload.kind !== "Support") {
            throw new Error(
                `SupportCard ${this.id} received non-Support payload (kind=${cardPayload.kind}); cannot play`,
            );
        }
        const { targetCell } = cardPayload as ISupportCardPayload;

        // Activate this card's pre-created Effects (they already live in GameState,
        // minted inactive at game creation) — mirrors how a ShipCard deploys its Ship.
        // GameState owns the toggle (symmetric with expiry-deactivation).
        const activateSignals = gsm.gameState.effects
            .filter((e) => e.sourceCardId === this.id)
            .map(
                (effect) =>
                    new GameActivateEffectSignal({
                        senderId: this.id,
                        originId: signal.id,
                        payload: { effectId: effect.id, targetCell },
                    }),
            );

        emitter([
            ...activateSignals,
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

        if (firstEffect && firstEffect.range > 0) {
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

    /** Persist the resolved support data alongside the base card fields. */
    public toPlain(): IPlainCard {
        return {
            ...super.toPlain(),
            description: this.description,
            commandPointCost: this.commandPointCost,
            effects: this.effects,
        };
    }

    public static toDomain(plain: IPlainCard): SupportCard {
        return new SupportCard(plain);
    }
}
