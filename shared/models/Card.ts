import { ICard, IGameState, IMEvent, IPlainCard, IPlayCardSignalHandleCtx, IPlayerAction, TActionMeta, TPlayCardPayload } from "../types";
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

    public buildAction(_meta: TActionMeta, _payload: TPlayCardPayload): IPlayerAction {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement buildAction`);
    }

    /**
     * Resolve this card through the signal engine: a played card emits the
     * signals that carry out its effect (a ShipCard emits a deploy + the card
     * lifecycle). Subclasses that resolve via signals override this; others
     * (still on the legacy path) leave it unimplemented.
     */
    public play(_ctx: IPlayCardSignalHandleCtx): IGameState {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement play`);
    }

    public getSelectionEvent(_handlers: ICardSelectionHandlers): IMEvent {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement getSelectionEvent`);
    }

    public toPlain(): IPlainCard {
        return {
            id: this.id,
            deckId: this.deckId,
            instanceId: this.instanceId,
            kind: this.kind,
            refNo: this.refNo,
        };
    }
}
