import { IGameActivateEffectSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

/**
 * Player plays a support card → the pre-created Effect it owns is toggled
 * active. Symmetric with expiry (GameRemoveExpiredEffects → deactivate): the
 * GameState owns the effect-lifecycle transitions. The immediate on-play impact
 * is then resolved (no-op for passive vision; emits signals for active effects).
 */
export class GameActivateEffectSignalHandler extends SignalHandler {
    handle(ctx: IGameActivateEffectSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { effectId, targetCell } = ctx.signal.payload;

        const effect = gsm.gameState.activateEffect(effectId, targetCell);
        if (effect) {
            effect.resolve(ctx);
            // One-shots have no lingering presence: the impact above is the whole effect.
            if (effect.duration === 0) {
                effect.isActive = false;
            }
        }

        saveNewState(gsm.gameState);
    }
}
