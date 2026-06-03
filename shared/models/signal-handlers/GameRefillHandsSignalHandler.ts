import { IGameRefillHandsSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameRefillHandsSignalHandler extends SignalHandler {
    handle(ctx: IGameRefillHandsSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { maxHandSize } = ctx.signal.payload;
        gsm.gameState.refillHands(maxHandSize);
        saveNewState(gsm.gameState);
    }
}
