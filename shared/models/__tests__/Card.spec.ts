import { Card, ICardPlaySink } from "../Card";
import { CardKind } from "../../config/constants";

describe("Card", () => {
    const baseProps = {
        id: "card-1",
        deckId: "deck-1",
        instanceId: "ship-1",
        kind: CardKind.Ship,
        refNo: "frigate0",
    };

    it("should construct with all props", () => {
        const card = new Card(baseProps);
        expect(card.id).toBe("card-1");
        expect(card.deckId).toBe("deck-1");
        expect(card.instanceId).toBe("ship-1");
        expect(card.kind).toBe(CardKind.Ship);
        expect(card.refNo).toBe("frigate0");
    });

    it("isShipCard returns true for kind = Ship", () => {
        const card = new Card({ ...baseProps, kind: CardKind.Ship });
        expect(card.isShipCard()).toBe(true);
    });

    it("update merges partial props but ignores id mismatch", () => {
        const card = new Card(baseProps);
        const updated = card.update({ id: "different-id", refNo: "flagship0" });
        // Entity.update bails if id mismatches — original is returned unchanged
        expect(updated.id).toBe("card-1");
        expect(updated.refNo).toBe("frigate0");
    });

    it("update applies fields when id matches", () => {
        const card = new Card(baseProps);
        card.update({ id: "card-1", refNo: "flagship0" });
        expect(card.refNo).toBe("flagship0");
    });

    describe("onPlay", () => {
        const makeSink = (): ICardPlaySink & { received: Card[] } => {
            const received: Card[] = [];
            return {
                received,
                addToPlayed(card: Card) {
                    received.push(card);
                },
            };
        };

        it("hasDeckBound is false until bindDeck is called", () => {
            const card = new Card(baseProps);
            expect(card.hasDeckBound()).toBe(false);
            card.bindDeck(makeSink());
            expect(card.hasDeckBound()).toBe(true);
        });

        it("routes itself to the bound sink on play", () => {
            const card = new Card(baseProps);
            const sink = makeSink();
            card.bindDeck(sink);

            card.onPlay();

            expect(sink.received).toHaveLength(1);
            expect(sink.received[0]).toBe(card);
        });

        it("throws when played without a bound deck", () => {
            const card = new Card(baseProps);
            expect(() => card.onPlay()).toThrow(/no deck bound/);
        });
    });
});
