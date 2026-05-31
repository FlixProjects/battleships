import { IHullDestroyedSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class HullDestroyedSignalHandler extends SignalHandler {
    handle(ctx: IHullDestroyedSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { shipId } = ctx.signal.payload;

        const ship = gsm.getShip(shipId);
        ship.resolveDestroyed();

        saveNewState(gsm.gameState);
    }
}
