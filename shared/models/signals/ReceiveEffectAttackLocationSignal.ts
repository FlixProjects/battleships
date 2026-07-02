import { Signal } from "./Signal";
import { IReceiveEffectAttackLocationSignalPayload, SignalType } from "./types";

/**
 * Targeted follow-up to `EffectAttackLocation`: the world located a hull on the
 * struck tile and now tells that hull's Ship to take the hit. The Ship applies
 * it through the standard damage cascade (mirrors `ReceiveShipAttack`).
 */
export class ReceiveEffectAttackLocationSignal extends Signal {
    public type: SignalType = SignalType.ReceiveEffectAttackLocation;
    public payload: IReceiveEffectAttackLocationSignalPayload;
    constructor(props: Readonly<Partial<ReceiveEffectAttackLocationSignal>>) {
        super(props);
    }
}
