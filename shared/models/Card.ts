import { ICard } from "../types";
import { CardEntity } from "./entities/CardEntity";

export interface ICardPlaySink {
    addToPlayed(card: Card): unknown;
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
}
