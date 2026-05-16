import { IPlayerAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

/**
 * Pipeline slot for effect resolution. Support-card effect resolution and the
 * `onEnter`/`onMove`/`onExit` tile hook points are migrated here in Step 8
 * (gated, its own commit — C2). Until then this is a documented no-op so the
 * pipeline shape is in place with zero behaviour change.
 */
export class ResolveEffectsStep implements IResolveStep {
    public readonly name = "ResolveEffects";

    resolve(_action: IPlayerAction, _ctx: IResolveStepContext): void {
        // no-op until Step 8
    }
}
