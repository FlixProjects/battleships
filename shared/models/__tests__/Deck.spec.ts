import { Faction } from "../../factions";
import { CardKind, ICard } from "../../types";
import { Deck } from "../Deck";

const makeCard = (id: string, refNo: string, deckId = "deck-1"): ICard => ({
    id,
    deckId,
    instanceId: `${id}-instance`,
    kind: CardKind.Ship,
    refNo,
});

const baseProps = (cards: ICard[]) => ({
    id: "deck-1",
    playerId: "p1",
    faction: Faction.THE_UNITED_FLEET,
    cards,
});

describe("Deck", () => {
    describe("constructor (rehydration)", () => {
        it("preserves the order of cards as given — no shuffling", () => {
            const cards = [
                makeCard("c1", "frigate0"),
                makeCard("c2", "flagship0"),
                makeCard("c3", "frigate0"),
            ];
            const deck = new Deck(baseProps(cards));
            expect(deck.cards.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
        });

        it("rehydrates twice without reshuffling", () => {
            const persistedOrder = ["c2", "c1", "c3"];
            const orderedCards = persistedOrder.map((id) => makeCard(id, "frigate0"));
            const deckA = new Deck(baseProps(orderedCards));
            const deckB = new Deck(baseProps(orderedCards));
            expect(deckA.cards.map((c) => c.id)).toEqual(persistedOrder);
            expect(deckB.cards.map((c) => c.id)).toEqual(persistedOrder);
        });
    });

    describe("Deck.create", () => {
        it("pins cards matching pinnedRefNo to the top", () => {
            const deck = Deck.create({
                ...baseProps([
                    makeCard("c1", "frigate0"),
                    makeCard("c2", "frigate0"),
                    makeCard("c3", "flagship0"),
                    makeCard("c4", "frigate0"),
                ]),
                pinnedRefNo: "flagship0",
                rng: () => 0,
            });
            expect(deck.cards[0].refNo).toBe("flagship0");
            expect(deck.cards.length).toBe(4);
        });

        it("preserves relative order of pinned cards", () => {
            const deck = Deck.create({
                ...baseProps([
                    makeCard("flag-a", "flagship0"),
                    makeCard("c1", "frigate0"),
                    makeCard("flag-b", "flagship0"),
                ]),
                pinnedRefNo: "flagship0",
                rng: () => 0,
            });
            expect(deck.cards[0].id).toBe("flag-a");
            expect(deck.cards[1].id).toBe("flag-b");
        });

        it("is deterministic given a seeded RNG", () => {
            const seeded = (seed: number[]) => {
                let i = 0;
                return () => seed[i++ % seed.length];
            };
            const ids = ["c1", "c2", "c3", "c4"];
            const cards = ids.map((id) => makeCard(id, "frigate0"));
            const deckA = Deck.create({ ...baseProps(cards), rng: seeded([0.1, 0.5, 0.9]) });
            const deckB = Deck.create({ ...baseProps(cards), rng: seeded([0.1, 0.5, 0.9]) });
            expect(deckA.cards.map((c) => c.id)).toEqual(deckB.cards.map((c) => c.id));
        });
    });

    describe("draw", () => {
        it("removes drawn cards from the top of the deck", () => {
            const deck = new Deck(
                baseProps([
                    makeCard("c1", "flagship0"),
                    makeCard("c2", "frigate0"),
                    makeCard("c3", "frigate0"),
                    makeCard("c4", "frigate0"),
                ]),
            );
            const drawn = deck.draw(2);
            expect(drawn.map((c) => c.id)).toEqual(["c1", "c2"]);
            expect(deck.size).toBe(2);
            expect(deck.cards.map((c) => c.id)).toEqual(["c3", "c4"]);
        });

        it("draws all cards when count exceeds deck size", () => {
            const deck = new Deck(baseProps([makeCard("c1", "frigate0"), makeCard("c2", "frigate0")]));
            const drawn = deck.draw(10);
            expect(drawn.length).toBe(2);
            expect(deck.size).toBe(0);
        });

        it("returns an empty array when deck is empty", () => {
            const deck = new Deck(baseProps([]));
            expect(deck.draw(3)).toEqual([]);
            expect(deck.size).toBe(0);
        });
    });
});
