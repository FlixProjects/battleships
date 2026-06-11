import {
    DeployingShipIMEvent,
    ICard,
    IGameState,
    IMEventType,
    IPlainCard,
    IPlayCardSignalHandleCtx,
    IShipCardPayload,
} from "../types";
import { BasicShipDeploySignal } from "./signals/BasicShipDeploySignal";
import { DeckAddToPlayedSignal } from "./signals/DeckAddToPlayedSignal";
import { PlayerRemoveCardFromHandSignal } from "./signals/PlayerRemoveCardFromHandSignal";
import { Card, ICardSelectionHandlers } from "./Card";

/**
 * Card that deploys a Ship. Its `instanceId` points at the Ship to deploy; the
 * payload supplies the deploy anchor. `play` emits the deploy cascade (reusing
 * Ship.deploy) plus the card-lifecycle signals — no inner action is synthesised.
 */
export class ShipCard extends Card {
    constructor(props: Readonly<ICard>) {
        super(props);
    }

    public play(ctx: IPlayCardSignalHandleCtx): IGameState {
        const { gsm, signal, emitter } = ctx;
        const { playerId, cardPayload } = signal.payload;

        if (cardPayload.kind !== "Ship") {
            throw new Error(
                `ShipCard ${this.id} received non-Ship payload (kind=${cardPayload.kind}); cannot play`,
            );
        }
        const { location } = cardPayload as IShipCardPayload;

        emitter([
            // Deploy the ship (Ship.deploy handles hull creation + CP spend).
            new BasicShipDeploySignal({
                targetId: this.instanceId,
                senderId: this.id,
                originId: signal.id,
                payload: { shipId: this.instanceId, location },
            }),
            // Card lifecycle: the Player owns the hand, the Deck owns the played pile.
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

    public getSelectionEvent(handlers: ICardSelectionHandlers): DeployingShipIMEvent {
        return {
            type: IMEventType.DEPLOYING_SHIP,
            shipId: this.instanceId,
            ...handlers,
        };
    }

    /** Concrete-subclass hydration. Inherits toPlain from Card. */
    public static toDomain(plain: IPlainCard): ShipCard {
        return new ShipCard(plain);
    }
}
