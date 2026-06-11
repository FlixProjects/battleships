import { IHullReceiveDamageSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class HullReceiveDamageSignalHandler extends SignalHandler {
    handle(ctx: IHullReceiveDamageSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { hullId } = ctx.signal.payload;

        const hull = gsm.getHull(hullId);

        const newState = hull.receiveDamage(ctx);

        saveNewState(newState);
    }
}
