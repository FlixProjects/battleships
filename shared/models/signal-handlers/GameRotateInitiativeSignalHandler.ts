import { ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameRotateInitiativeSignalHandler extends SignalHandler {
    handle(ctx: ISignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        gsm.gameState.rotateInitiative();
        saveNewState(gsm.gameState);
    }
}
