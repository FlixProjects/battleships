import { ICard, IDeck, IGameState, IPlainDeck, TFaction } from "../types";
import { Card } from "./Card";
import { DeckEntity } from "./entities/DeckEntity";

export type RandomFn = () => number;

export interface IDeckCreateProps {
    id: string;
    playerId: string;
    faction: TFaction;
    cards: ICard[];
    pinnedCardId?: string;
    rng?: RandomFn;
}

export class Deck extends DeckEntity {
    /**
     * Constructs a Deck from existing data. Use this to **rehydrate** a deck
     * from persisted state (S3, network) — the cards keep their saved order.
     *
     * To create a brand-new deck for a fresh game, use `Deck.create()` so that
     * the one-time shuffle happens. Never shuffle outside of `create()`.
     */
    constructor(props: Readonly<IDeck>) {
        super(props);
    }

    /**
     * Creates a brand-new deck and shuffles it exactly once.
     *
     * `pinnedCardId`, if provided, holds the matching card at the top of the
     * deck so it is guaranteed to be among the first cards drawn — used to
     * satisfy the "flagship always starts in hand" rule. Pinning by card id
     * (not refNo) keeps Deck decoupled from Ship config: the caller decides
     * which concrete card is the flagship.
     */
    public static create(props: IDeckCreateProps): Deck {
        const deck = new Deck({
            id: props.id,
            playerId: props.playerId,
            faction: props.faction,
            cards: props.cards,
            played: [],
        });
        deck.shuffleOnce(props.pinnedCardId, props.rng ?? Math.random);
        return deck;
    }

    /** Draws up to `count` cards from the top of the deck and returns them. The drawn cards are removed from the deck. */
    public draw(count: number): Card[] {
        const drawn = this.cards.slice(0, count);
        this.cards = this.cards.slice(count);
        return drawn;
    }

    public addToPlayed(card: Card): this {
        this.played.push(card);
        return this;
    }

    public get size(): number {
        return this.cards.length;
    }

    /**
     * Fisher–Yates shuffle, with optional pinning. Private so the only way to
     * trigger it is via `Deck.create()` — guaranteeing one shuffle per deck.
     */
    private shuffleOnce(pinnedCardId: string | undefined, rng: RandomFn): void {
        const pinned: Card[] = [];
        const rest: Card[] = [];
        this.cards.forEach((c) => (c.id === pinnedCardId ? pinned.push(c) : rest.push(c)));

        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }

        this.cards = [...pinned, ...rest];
    }

    /** Flattens cards/played to ID arrays. */
    public toPlain(): IPlainDeck {
        return {
            id: this.id,
            playerId: this.playerId,
            faction: this.faction,
            cards: this.cards.map((c) => c.id),
            played: this.played.map((c) => c.id),
        };
    }

    public static toDomain(plain: IPlainDeck, state: IGameState): Deck {
        const cardsById = new Map<string, Card>(
            (state.cards ?? []).filter((c): c is Card => c instanceof Card).map((c) => [c.id, c]),
        );
        const hydrate = (ids: string[]): Card[] =>
            ids.map((id) => cardsById.get(id)).filter((c): c is Card => c !== undefined);
        return new Deck({
            id: plain.id,
            playerId: plain.playerId,
            faction: plain.faction,
            cards: hydrate(plain.cards),
            played: hydrate(plain.played),
        });
    }
}
