import { CardKind } from "../../types";
import { Card } from "../Card";

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
});
