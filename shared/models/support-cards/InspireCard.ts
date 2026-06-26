import { SUPPORT_REF_NO } from "../../config/constants";
import { EffectKind } from "../../types";
import { buildEffect } from "../../utils/effect-helper";
import { registerSupportCard } from "../../utils/support-card-helper";
import { Effect } from "../effects/Effect";
import { ICreateEffectsArgs, SupportCard } from "../SupportCard";

/**
 * Support that grants command points: each template mints a one-shot
 * command-point Effect for its configured amount.
 */
export class InspireCard extends SupportCard {
    protected createEffects({ playerId, currentRound }: ICreateEffectsArgs): Effect[] {
        return this.effectTemplates.map((template) => {
            if (template.kind !== EffectKind.CommandPoint) {
                throw new Error(
                    `InspireCard ${this.id} expects a command-point effect, got '${template.kind}' (${template.refNo})`,
                );
            }
            return buildEffect({
                template,
                playerId,
                sourceCardId: this.id,
                currentRound,
            });
        });
    }
}

registerSupportCard(SUPPORT_REF_NO.inspire, InspireCard);
