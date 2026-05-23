import { ISignalHandleCtx } from "@shared/types/types";
import { Signal } from "../signals/Signal";
import { SignalHandler } from "./SignalHandler";

export class BasicShipAttackSignalHandler extends SignalHandler {
    handle(signal: Signal, ctx: ISignalHandleCtx) {
        // TODO: should be the same as ResolveAttackStep
        // change GameEngine.commit.shipAttack to AttackCalculator and call it here
    }
}
