import { ICard, IMEvent, IPlayerAction, TActionMeta, TPlayCardPayload } from "../types";
import { CardEntity } from "./entities/CardEntity";

export interface ICardPlaySink {
    addToPlayed(card: Card): unknown;
}

export interface ICardSelectionHandlers {
    onGlobalDeselect?: () => void;
    onSuccessfulSelect?: () => void;
}

export class Card extends CardEntity {
    private deck?: ICardPlaySink;

    constructor(props: Readonly<ICard>) {
        super(props);
    }

    public isShipCard(): boolean {
        return this.kind === "Ship";
    }

    public bindDeck(deck: ICardPlaySink): this {
        this.deck = deck;
        return this;
    }

    public hasDeckBound(): boolean {
        return this.deck !== undefined;
    }

    public onPlay(): void {
        if (!this.deck) {
            throw new Error(`Card ${this.id} cannot be played: no deck bound`);
        }
        this.deck.addToPlayed(this);
    }

    /**
     * Builds the inner action this card triggers when played. Each concrete
     * card kind (ShipCard, future SupportCard, …) overrides this to produce a
     * fully-typed action (e.g. IDeployAction). Subclasses are picked by the
     * `createCard` factory based on the persisted `kind` discriminator.
     */
    public buildAction(_meta: TActionMeta, _payload: TPlayCardPayload): IPlayerAction {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement buildAction`);
    }

    /**
     * Builds the InteractionManager event this card dispatches when the
     * player selects it from hand. Each card kind owns the mapping from
     * "I was selected" → "this is what the IM should do next" — keeps Hand
     * (and any other hand-renderer) free of per-kind switches.
     */
    public getSelectionEvent(_handlers: ICardSelectionHandlers): IMEvent {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement getSelectionEvent`);
    }

    /**
     * Plain serialization shape — explicitly drops the runtime-only `deck`
     * back-reference that would otherwise close a Card↔Deck cycle and break
     * JSON.stringify (used by sessionStorage, network transport, etc.).
     */
    public toJSON(): ICard {
        return {
            id: this.id,
            deckId: this.deckId,
            instanceId: this.instanceId,
            kind: this.kind,
            refNo: this.refNo,
        };
    }
}
