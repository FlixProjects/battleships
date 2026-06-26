import { CardKind, EFFECT_REF_NO, SUPPORT_REF_NO } from "../../config/constants";
import { EffectAnchor, EffectKind, ICard } from "../../types";
import { createCard } from "../../utils/card-helper";
import { FlareCard } from "../support-cards/FlareCard";
import { InspireCard } from "../support-cards/InspireCard";
import { SupportCard } from "../SupportCard";

describe("SupportCard registry (createCard dispatch)", () => {
    const baseSupportProps = (refNo: string, overrides?: Partial<ICard>): ICard => ({
        id: `card-${refNo}`,
        deckId: "deck-1",
        instanceId: `card-${refNo}`,
        kind: CardKind.Support,
        refNo,
        name: refNo,
        effectTemplates: [],
        ...overrides,
    });

    it("hydrates the Flare refNo into a FlareCard", () => {
        const card = createCard(baseSupportProps(SUPPORT_REF_NO.flare));
        expect(card).toBeInstanceOf(FlareCard);
    });

    it("hydrates the Inspire refNo into an InspireCard", () => {
        const card = createCard(baseSupportProps(SUPPORT_REF_NO.inspire));
        expect(card).toBeInstanceOf(InspireCard);
    });

    it("falls back to the base SupportCard for an unregistered Support refNo", () => {
        const card = createCard(baseSupportProps("unknown_support"));
        expect(card).toBeInstanceOf(SupportCard);
        expect(card).not.toBeInstanceOf(FlareCard);
        expect(card).not.toBeInstanceOf(InspireCard);
    });

    it("persists effectTemplates through toPlain → toDomain round-trip", () => {
        const template = {
            refNo: EFFECT_REF_NO.flarePersistent,
            kind: EffectKind.Vision,
            anchor: EffectAnchor.AnyTile,
            range: 2,
            duration: 2,
            existsOnBoard: true,
        } as const;
        const card = createCard(baseSupportProps(SUPPORT_REF_NO.flare, { effectTemplates: [template] }));

        const replain = card.toPlain();
        expect(replain.effectTemplates).toEqual([template]);
    });
});
