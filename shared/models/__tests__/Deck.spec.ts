import { ICard } from "../../types";
import { Card } from "../Card";
import { CardKind, Faction } from "../../config/constants";
import { Deck } from "../Deck";
import { ShipCard } from "../ShipCard";
import { GameState } from "../GameState";

const makeCard = (id: string, refNo: string, deckId = "deck-1"): ICard => ({
    id,
    deckId,
    instanceId: `${id}-instance`,
    kind: CardKind.Ship,
    refNo,
    name: refNo, // FIXME: should pass in name
});

const makeCards = (ids: string[]) => ids.map((id) => makeCard(id, "frigate0"));

const cardIds = (cards: ICard[]) => cards.map((c) => c.id);

const baseProps = (cards: ICard[], played: ICard[] = []) => ({
    id: "deck-1",
    playerId: "p1",
    faction: Faction.THE_UNITED_DEFENSE_FLEET,
    cards,
    played,
});

describe("Deck", () => {
    describe("constructor (rehydration)", () => {
        it("preserves the order of cards as given — no shuffling", () => {
            const cards = [makeCard("c1", "frigate0"), makeCard("c2", "flagship0"), makeCard("c3", "frigate0")];
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
        it("pins the card matching pinnedCardId to the top", () => {
            const deck = Deck.create({
                ...baseProps([
                    makeCard("c1", "frigate0"),
                    makeCard("c2", "frigate0"),
                    makeCard("c3", "flagship0"),
                    makeCard("c4", "frigate0"),
                ]),
                pinnedCardId: "c3",
                rng: () => 0,
            });
            expect(deck.cards[0].id).toBe("c3");
            expect(deck.cards.length).toBe(4);
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

    describe("Deck.create (defaults)", () => {
        it("starts with an empty played pile", () => {
            const deck = Deck.create(baseProps(makeCards(["c1", "c2"]), makeCards(["c3"])));

            expect(deck.played).toEqual([]);
        });

        it("keeps every card when shuffling with the default rng", () => {
            const deck = Deck.create(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            expect(cardIds(deck.cards).sort()).toEqual(["c1", "c2", "c3", "c4"]);
        });
    });

    describe("shuffleOnce", () => {
        it("reorders the cards using the given rng", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            deck.shuffleOnce(undefined, () => 0);

            expect(cardIds(deck.cards)).toEqual(["c2", "c3", "c4", "c1"]);
        });

        it("keeps the order when the rng always picks the current card", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            deck.shuffleOnce(undefined, () => 0.999);

            expect(cardIds(deck.cards)).toEqual(["c1", "c2", "c3", "c4"]);
        });

        it("holds the pinned card at the top and shuffles the rest", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            deck.shuffleOnce("c3", () => 0);

            expect(cardIds(deck.cards)).toEqual(["c3", "c2", "c4", "c1"]);
        });

        it("shuffles every card when the pinned card is not in the deck", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            deck.shuffleOnce("missing", () => 0);

            expect(cardIds(deck.cards)).toEqual(["c2", "c3", "c4", "c1"]);
        });

        it("leaves an empty or single-card deck as it is", () => {
            const emptyDeck = new Deck(baseProps([]));
            const singleCardDeck = new Deck(baseProps(makeCards(["c1"])));

            emptyDeck.shuffleOnce(undefined, () => 0);
            singleCardDeck.shuffleOnce(undefined, () => 0);

            expect(emptyDeck.cards).toEqual([]);
            expect(cardIds(singleCardDeck.cards)).toEqual(["c1"]);
        });

        it("does not touch the played pile", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3"]), makeCards(["c4", "c5"])));

            deck.shuffleOnce(undefined, () => 0);

            expect(cardIds(deck.played)).toEqual(["c4", "c5"]);
        });
    });

    describe("loadPlainCards", () => {
        it("replaces the deck's cards with the given cards in order", () => {
            const deck = new Deck(baseProps(makeCards(["c1"])));

            deck.loadPlainCards(makeCards(["c3", "c2", "c4"]));

            expect(cardIds(deck.cards)).toEqual(["c3", "c2", "c4"]);
            expect(deck.size).toBe(3);
        });

        it("hydrates the cards so they can be shuffled and drawn", () => {
            const deck = Deck.create(baseProps([]));

            deck.loadPlainCards(makeCards(["c1", "c2", "c3", "c4"]));
            deck.shuffleOnce("c3", () => 0);

            expect(cardIds(deck.draw(2))).toEqual(["c3", "c2"]);
            expect(cardIds(deck.cards)).toEqual(["c4", "c1"]);
        });

        it("hydrates each card into its concrete card class", () => {
            const deck = new Deck(baseProps([]));

            deck.loadPlainCards(makeCards(["c1"]));

            expect(deck.cards[0]).toBeInstanceOf(ShipCard);
        });

        it("does not touch the played pile", () => {
            const deck = new Deck(baseProps([], makeCards(["c9"])));

            deck.loadPlainCards(makeCards(["c1"]));

            expect(cardIds(deck.played)).toEqual(["c9"]);
        });
    });

    describe("toPlain", () => {
        it("flattens cards and played to ids in their current order", () => {
            const deck = new Deck(baseProps(makeCards(["c2", "c1"]), makeCards(["c4", "c3"])));

            expect(deck.toPlain()).toEqual({
                id: "deck-1",
                playerId: "p1",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards: ["c2", "c1"],
                played: ["c4", "c3"],
            });
        });

        it("reflects the shuffled order and drawn cards", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3", "c4"])));

            deck.shuffleOnce(undefined, () => 0);
            deck.draw(1);

            expect(deck.toPlain().cards).toEqual(["c3", "c4", "c1"]);
        });
    });

    describe("Deck.toDomain", () => {
        const stateWith = (ids: string[]) =>
            new GameState({
                code: "ABCD",
                currentRound: 0,
                players: [],
                ships: [],
                cards: makeCards(ids),
                decks: [],
                winners: [],
                isOver: false,
            });

        it("hydrates cards and played from the state's cards in the plain order", () => {
            const plain = new Deck(baseProps(makeCards(["c3", "c1"]), makeCards(["c2"]))).toPlain();

            const deck = Deck.toDomain(plain, stateWith(["c1", "c2", "c3"]));

            expect(cardIds(deck.cards)).toEqual(["c3", "c1"]);
            expect(cardIds(deck.played)).toEqual(["c2"]);
            expect(deck.toPlain()).toEqual(plain);
        });

        it("skips card ids that are missing from the state", () => {
            const plain = new Deck(baseProps(makeCards(["c1", "c2"]))).toPlain();

            const deck = Deck.toDomain(plain, stateWith(["c2"]));

            expect(cardIds(deck.cards)).toEqual(["c2"]);
        });
    });

    describe("size", () => {
        it("counts the cards left in the deck, not the played pile", () => {
            const deck = new Deck(baseProps(makeCards(["c1", "c2", "c3"]), makeCards(["c4"])));

            deck.draw(1);

            expect(deck.size).toBe(2);
        });
    });

    describe("addToPlayed", () => {
        it("appends the card to the played pile", () => {
            const c1 = makeCard("c1", "frigate0");
            const c2 = makeCard("c2", "frigate0");
            const deck = new Deck(baseProps([c1, c2]));

            deck.addToPlayed(new Card(c1));

            expect(deck.played.map((c) => c.id)).toEqual(["c1"]);
        });

        it("preserves play order", () => {
            const c1 = makeCard("c1", "frigate0");
            const c2 = makeCard("c2", "frigate0");
            const deck = new Deck(baseProps([]));

            deck.addToPlayed(new Card(c2));
            deck.addToPlayed(new Card(c1));

            expect(deck.played.map((c) => c.id)).toEqual(["c2", "c1"]);
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
