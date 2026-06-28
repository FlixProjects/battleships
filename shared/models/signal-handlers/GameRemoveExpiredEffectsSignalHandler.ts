import { ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameRemoveExpiredEffectsSignalHandler extends SignalHandler {
    handle(ctx: ISignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        gsm.gameState.removeExpiredEffects();
        saveNewState(gsm.gameState);
    }
}
