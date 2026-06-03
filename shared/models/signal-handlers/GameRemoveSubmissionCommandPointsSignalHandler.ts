import { IGameRemoveSubmissionCommandPointsSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameRemoveSubmissionCommandPointsSignalHandler extends SignalHandler {
    handle(ctx: IGameRemoveSubmissionCommandPointsSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { playerId } = ctx.signal.payload;
        gsm.gameState.removeSubmissionCommandPoints(playerId);
        saveNewState(gsm.gameState);
    }
}
