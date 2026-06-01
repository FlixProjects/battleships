import { IGameStateCreateEffectSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameStateCreateEffectSignalHandler extends SignalHandler {
    handle(ctx: IGameStateCreateEffectSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { effect } = ctx.signal.payload;

        gsm.addEffect(effect);

        saveNewState(gsm.gameState);
    }
}
