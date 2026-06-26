import { SUPPORT_REF_NO } from "../../config/constants";
import { EffectKind } from "../../types";
import { buildEffect } from "../../utils/effect-helper";
import { registerSupportCard } from "../../utils/support-card-helper";
import { Effect } from "../effects/Effect";
import { ICreateEffectsArgs, SupportCard } from "../SupportCard";

/**
 * Support that reveals a targeted area: each template mints a vision Effect
 * centred on the chosen cell.
 */
export class FlareCard extends SupportCard {
    protected createEffects({ playerId, targetCell, currentRound }: ICreateEffectsArgs): Effect[] {
        return this.effectTemplates.map((template) =>
            buildEffect({
                template,
                playerId,
                sourceCardId: this.id,
                currentRound,
                targetCell,
            }),
        );
    }
}

registerSupportCard(SUPPORT_REF_NO.flare, FlareCard);
