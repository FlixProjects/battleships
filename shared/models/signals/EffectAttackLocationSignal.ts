import { Signal } from "./Signal";
import { IEffectAttackLocationSignalPayload, SignalType } from "./types";

/**
 * A board Effect (Airstrike) detonates on a tile. Broadcast (no targetId): every
 * Ship inspects the location and, if one of its own live hulls stands there,
 * re-enters the normal damage cascade (`HullReceiveAttack → …`).
 */
export class EffectAttackLocationSignal extends Signal {
    public type: SignalType = SignalType.EffectAttackLocation;
    public payload: IEffectAttackLocationSignalPayload;
    constructor(props: Readonly<Partial<EffectAttackLocationSignal>>) {
        super(props);
    }
}
