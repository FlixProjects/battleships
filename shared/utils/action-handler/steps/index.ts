import { IResolveStep } from "./types";
import { ResolveAttackStep } from "./ResolveAttackStep";
import { ResolveDeployStep } from "./ResolveDeployStep";
import { ResolveEffectsStep } from "./ResolveEffectsStep";
import { ResolveMoveStep } from "./ResolveMoveStep";
import { ResolvePlayCardStep } from "./ResolvePlayCardStep";

export * from "./types";
export { ResolvePlayCardStep, ResolveDeployStep, ResolveMoveStep, ResolveAttackStep, ResolveEffectsStep };

/**
 * The fixed, ordered per-action pipeline that replaces `resolveAction()`'s
 * switch. Each step is a no-op unless the action is relevant to it. Action
 * types are mutually exclusive, so this is behaviour-identical to the old
 * switch; the value is structural (substitutable units, no switch — C1).
 * Winner finalization stays turn-level in `resolve()` (resolved open question),
 * so there is no per-action win-check step.
 */
export const createResolvePipeline = (): IResolveStep[] => [
    new ResolvePlayCardStep(),
    // new ResolveDeployStep(), // migrated to GameEngineV2 (BasicShipDeploy signal) — incl. the PlayCard→Deploy inner path (ActionResolver.applyInnerAction)
    // new ResolveMoveStep(), // migrated to GameEngineV2 (BasicShipMove signal)
    // new ResolveAttackStep(), // migrated to GameEngineV2 (BasicShipAttack signal)
    new ResolveEffectsStep(),
];
