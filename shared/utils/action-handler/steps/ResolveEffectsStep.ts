import { IPlayerAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

/**
 *
 * - Support-card effects: `ResolvePlayCardStep` queues the support inner-action;
 *   this step drains + applies them end-to-end. The engine no longer has its
 *   own apply-support path — it just exposes `GameEngine.buildEffect` as the
 *   effect-builder helper the resolver calls.
 * - Tile-effect hooks: `onEnter` / `onMove` / `onExit` would fire here when a
 *   hull enters / moves within / leaves a tile. No concrete tile effects exist
 *   yet, so there is intentionally nothing to invoke (documented hook point).
 */
export class ResolveEffectsStep implements IResolveStep {
    public readonly name = "ResolveEffects";

    resolve(_action: IPlayerAction, ctx: IResolveStepContext): void {
        ctx.resolvePendingSupportEffects();
        // onEnter / onMove / onExit tile-effect hook points — no-op until tile
        // effects are introduced
    }
}
