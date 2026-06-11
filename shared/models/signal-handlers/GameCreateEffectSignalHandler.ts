import { IGameCreateEffectSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameCreateEffectSignalHandler extends SignalHandler {
    handle(ctx: IGameCreateEffectSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { effect } = ctx.signal.payload;

        gsm.addEffect(effect);

        saveNewState(gsm.gameState);
    }
}
