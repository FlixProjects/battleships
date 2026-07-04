import { ICard, IGameState, IGameStateManager, IMEvent, IPlainCard, IPlayCardSignalHandleCtx } from "../types";
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
     * Resolve this card through the signal engine: a played card emits the
     * signals that carry out its effect (ShipCard → deploy, SupportCard → effect
     * creation) plus the card lifecycle. Every concrete card kind overrides this.
     */
    public play(_ctx: IPlayCardSignalHandleCtx): IGameState {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement play`);
    }

    public getSelectionEvent(_handlers: ICardSelectionHandlers): IMEvent {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement getSelectionEvent`);
    }

    /** CP cost of playing this card. Kind-specific: a ShipCard's cost lives on
     *  the Ship it deploys, a SupportCard carries its own. */
    public getCommandPointCost(_gsm: IGameStateManager): number {
        throw new Error(`Card ${this.id} (kind=${this.kind}) does not implement getCommandPointCost`);
    }

    public toPlain(): IPlainCard {
        return {
            id: this.id,
            deckId: this.deckId,
            instanceId: this.instanceId,
            kind: this.kind,
            refNo: this.refNo,
            name: this.name,
        };
    }
}
