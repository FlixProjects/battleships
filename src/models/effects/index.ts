import { SupportCard } from "@shared/models";
import { FEEffect } from "./FEEffect";

export { FEEffect };

/**
 * Builds the FEEffect chain for a SupportCard so the InteractionManager can
 * step through its Effects sequentially. Multi-effect Supports walk the
 * chain via `onSuccessfulSelect`.
 */
export const buildFEEffects = (card: SupportCard): FEEffect[] => {
    return card.effects.map((cfg, idx) => new FEEffect(card.id, idx, cfg));
};
