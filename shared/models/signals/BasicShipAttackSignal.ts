import { Signal } from "./Signal";
import { SignalType } from "./types";

export class BasicShipAttackSignal extends Signal {
    type: SignalType = SignalType.BasicShipAttack;
}

