import { IHullMoveSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class HullMoveSignalHandler extends SignalHandler {
    handle(ctx: IHullMoveSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { hullId } = ctx.signal.payload;

        const hull = gsm.getHull(hullId);

        const newState = hull.move(ctx);

        saveNewState(newState);
    }
}
