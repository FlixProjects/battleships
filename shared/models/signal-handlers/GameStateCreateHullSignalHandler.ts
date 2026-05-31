import { IGameStateCreateHullSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameStateCreateHullSignalHandler extends SignalHandler {
    handle(ctx: IGameStateCreateHullSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { hull, shipId } = ctx.signal.payload;

        gsm.gameState.createHull(hull, shipId);

        saveNewState(gsm.gameState);
    }
}
