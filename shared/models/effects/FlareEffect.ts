import { IEffectRenderSpec } from "../../constants";
import { EffectKind, IEffect, ISignalHandleCtx, IVisionEffect } from "../../types";
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

    public resolveTick(_ctx: ISignalHandleCtx): void {
        // Same as resolve — passive vision, no per-round mutation.
    }

    public getRenderSpec(): IEffectRenderSpec {
        return {
            ...super.getRenderSpec(),
            frames: ["flare/flare-0.png", "flare/flare-1.png", "flare/flare-2.png"],
        };
    }

    public toPlain(): IVisionEffect {
        return { ...super.toPlain(), kind: EffectKind.Vision, location: this.location, range: this.range };
    }
}

registerEffect(EFFECT_REF_NO.flare, FlareEffect);
registerEffect(EFFECT_REF_NO.flarePersistent, FlareEffect);
