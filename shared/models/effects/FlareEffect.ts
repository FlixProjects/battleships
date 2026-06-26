import { EffectKind, IEffect, IGameState, ISignalHandleCtx, IVisionEffect } from "../../types";
import { registerEffect } from "../../utils/effect-helper";
import { EFFECT_REF_NO } from "../../config/constants";
import { Effect } from "./Effect";

/**
 * Persistent vision Effect. The grant of visibility itself is data-driven —
 * `GameState.getVisibleTilesforPlayer` reads from `gameState.effects` of
 * `kind === Vision`. So both `resolve()` and `resolveTick()` are no-ops; the
 * lifecycle (add on commit, drop on expiry) is handled by ActionResolver.
 */
export class FlareEffect extends Effect {
    public range: number;

    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(_ctx: ISignalHandleCtx): void {
        // Vision is read live from gameState.effects — no on-play impact to emit.
    }

    public resolveTick(_gameState: IGameState): void {
        // Same as resolve — passive vision, no per-round mutation.
    }

    public toPlain(): IVisionEffect {
        return { ...super.toPlain(), kind: EffectKind.Vision, range: this.range };
    }
}

registerEffect(EFFECT_REF_NO.flare, FlareEffect);
registerEffect(EFFECT_REF_NO.flarePersistent, FlareEffect);
