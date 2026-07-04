import { IEffectAttackLocationSignalHandleCtx } from "@shared/types/types";
import { locationToKey } from "../../utils/helpers";
import { Attack } from "../Attack";
import { ReceiveEffectAttackLocationSignal } from "../signals/ReceiveEffectAttackLocationSignal";

export class EffectAttackLocationSignalHandler {
    handle(ctx: IEffectAttackLocationSignalHandleCtx) {
        const { gsm, signal, emitter } = ctx;
        const { location, damage, sourceEffectId } = signal.payload;

        const key = locationToKey(location);
        const hull = gsm.getHulls().find((h) => !h.destroyed && locationToKey(h.location) === key);
        if (!hull) return;

        emitter([
            new ReceiveEffectAttackLocationSignal({
                targetId: hull.shipId,
                senderId: sourceEffectId,
                originId: signal.id,
                payload: {
                    shipId: hull.shipId,
                    attack: new Attack({ originId: sourceEffectId, targetId: hull.id, damage, isIgnoreArmor: false }),
                },
            }),
        ]);
    }
}
