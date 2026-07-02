import { EffectKind, ICellLoc, IDamageEffect, IEffect, ISignalHandleCtx } from "../../types";
import { EFFECT_REF_NO } from "../../config/constants";
import { registerEffect } from "../../utils/effect-helper";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { EffectAttackLocationSignalHandler } from "../signal-handlers/EffectAttackLocationSignalHandler";
import { EffectAttackLocationSignal } from "../signals/EffectAttackLocationSignal";
import { SignalType } from "../signals/types";
import { Effect } from "./Effect";

/**
 * Delayed board strike. Placed as a warning marker on a single tile; on the next
 * persistent-effects tick it emits an `EffectAttackLocation` so any hull standing
 * on its tile (either player's) takes damage through the normal cascade, then
 * removes itself so it detonates exactly once.
 */
export class AirstrikeEffect extends Effect {
    public damage: number;

    constructor(props: Readonly<IEffect & { damage?: number; location?: ICellLoc }>) {
        super(props);
        this.damage = props.damage ?? 0;
    }

    protected getDefaultListeners(): IListener[] {
        return [...super.getDefaultListeners(), this.createEffectAttackLocationListener()];
    }

    protected createEffectAttackLocationListener() {
        return new Listener(
            [SignalType.EffectAttackLocation],
            (ctx) => {
                new EffectAttackLocationSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    public resolve(_ctx: ISignalHandleCtx): void {
        // No on-play impact — the strike is telegraphed now and lands on the tick.
    }

    public resolveTick(ctx: ISignalHandleCtx): void {
        const { gsm, signal, emitter } = ctx;

        if (this.location) {
            emitter([
                new EffectAttackLocationSignal({
                    targetId: this.id,
                    senderId: this.id,
                    originId: signal.originId,
                    payload: { location: this.location, damage: this.damage, sourceEffectId: this.id },
                }),
            ]);
        }

        // Consume: one warning tile detonates once, regardless of expiry window.
        gsm.gameState.removeEffect(this.id);
    }

    public toPlain(): IDamageEffect {
        return { ...super.toPlain(), kind: EffectKind.Damage, location: this.location, damage: this.damage };
    }
}

registerEffect(EFFECT_REF_NO.airstrike, AirstrikeEffect);
