import { ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GamePersistentEffectsTickSignalHandler extends SignalHandler {
    handle(ctx: ISignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        gsm.gameState.tickPersistentEffects(ctx);
        saveNewState(gsm.gameState);
    }
}
