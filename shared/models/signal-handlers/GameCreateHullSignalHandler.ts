import { IGameCreateHullSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class GameCreateHullSignalHandler extends SignalHandler {
    handle(ctx: IGameCreateHullSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { hull, shipId } = ctx.signal.payload;

        gsm.gameState.createHull(hull, shipId);

        saveNewState(gsm.gameState);
    }
}
