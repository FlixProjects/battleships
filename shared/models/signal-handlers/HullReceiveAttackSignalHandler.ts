import { IHullReceiveAttackSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class HullReceiveAttackSignalHandler extends SignalHandler {
    handle(ctx: IHullReceiveAttackSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { hullId } = ctx.signal.payload;

        const hull = gsm.getHull(hullId);

        const newState = hull.receiveAttack(ctx);

        saveNewState(newState);
    }
}
