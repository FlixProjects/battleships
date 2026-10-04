import { ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameRefillHandsSignalHandler extends SignalHandler {
    handle(ctx: ISignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        gsm.gameState.refillHands();
        saveNewState(gsm.gameState);
    }
}
