import { IGameCreateEffectSignalHandleCtx } from "@shared/types/types";
import { createEffect } from "../../utils/effect-helper";
import { SignalHandler } from "./SignalHandler";

/**
 * A Support card was played → mint its Effect into the game. The on-play impact
 * is resolved immediately (one-shots like Inspire grant their command points
 * here); only persistent Effects then linger in state to tick and later expire.
 */
export class GameCreateEffectSignalHandler extends SignalHandler {
    handle(ctx: IGameCreateEffectSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const effect = createEffect(ctx.signal.payload.effect);

        effect.resolve(ctx);
        if (effect.isPersistent() || effect.isPermanent()) {
            gsm.addEffect(effect);
        }

        saveNewState(gsm.gameState);
    }
}
