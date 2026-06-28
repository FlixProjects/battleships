import { v7 as uuidv7 } from "uuid";
import { SUPPORT_REF_NO } from "../../config/constants";
import { EffectKind } from "../../types";
import { registerSupportCard } from "../../utils/support-card-helper";
import { Effect } from "../effects/Effect";
import { ICreateEffectsArgs, SupportCard } from "../SupportCard";
import { createEffect } from "@shared/utils/effect-helper";

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
            return createEffect({
                id: uuidv7(),
                sourceCardId: this.id,
                playerId,
                isActive: true,
                createdOnRound: currentRound,
                ...template,
            });
        });
    }
}

registerSupportCard(SUPPORT_REF_NO.inspire, InspireCard);
