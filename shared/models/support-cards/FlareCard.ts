import { v7 as uuidv7 } from "uuid";
import { SUPPORT_REF_NO } from "../../config/constants";
import { createEffect } from "../../utils/effect-helper";
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
            createEffect({
                id: uuidv7(),
                sourceCardId: this.id,
                playerId,
                isActive: true,
                createdOnRound: currentRound,
                expiresAfterRound: template.duration > 0 ? currentRound + template.duration : undefined,
                // Only on-board (targeted) effects carry a location.
                ...(targetCell ? { location: targetCell } : {}),
                ...template,
            }),
        );
    }
}

registerSupportCard(SUPPORT_REF_NO.flare, FlareCard);
