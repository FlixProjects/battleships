import { ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameWinnerDeterminedSignalHandler extends SignalHandler {
    handle(ctx: ISignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        gsm.gameState.determineWinner();
        saveNewState(gsm.gameState);
    }
}
