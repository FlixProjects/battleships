import { SUPPORTS_CONFIG, TSupportRefNo } from "@shared/constants";
import { FEEffect } from "./FEEffect";

export { FEEffect };

/**
 * Builds the FEEffect chain for a SupportCard so the InteractionManager can
 * step through its Effects sequentially. Multi-effect Supports walk the
 * chain via `onSuccessfulSelect`.
 */
export const buildFEEffects = (cardId: string, supportRefNo: string): FEEffect[] => {
    const supportConfig = SUPPORTS_CONFIG[supportRefNo as TSupportRefNo];
    if (!supportConfig) {
        throw new Error(`buildFEEffects: no SupportConfig for refNo '${supportRefNo}'`);
    }
    return supportConfig.effects.map((cfg, idx) => new FEEffect(cardId, idx, cfg));
};
