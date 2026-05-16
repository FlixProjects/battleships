import { IEffect, IGameStateManager } from "../../types";
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
    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(_gsm: IGameStateManager): void {
        // Vision is read live from gameState.effects — no mutation needed here.
    }

    public resolveTick(_gsm: IGameStateManager): void {
        // Same as resolve — passive vision, no per-round mutation.
    }
}

registerEffect(EFFECT_REF_NO.flare, FlareEffect);
registerEffect(EFFECT_REF_NO.flarePersistent, FlareEffect);
