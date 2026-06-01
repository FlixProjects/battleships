import { IResolveStep } from "./types";
import { ResolveAttackStep } from "./ResolveAttackStep";
import { ResolveDeployStep } from "./ResolveDeployStep";
import { ResolveMoveStep } from "./ResolveMoveStep";

export * from "./types";
export { ResolveDeployStep, ResolveMoveStep, ResolveAttackStep };

/**
 * The per-action step pipeline. Every action type (Deploy / Move / Attack /
 * PlayCard) now resolves through GameEngineV2 directly in `resolveAction`, so
 * the pipeline is empty — it remains as the extension point for any future
 * non-engine resolution step. The step classes below are kept (commented) as
 * the templates for that pattern until the legacy `GameEngine.commit.*` retires.
 */
export const createResolvePipeline = (): IResolveStep[] => [
    // new ResolvePlayCardStep(), // migrated — PLAY_CARD now in the resolveAction engine guard
    // new ResolveDeployStep(), // migrated to GameEngineV2 (BasicShipDeploy signal)
    // new ResolveMoveStep(), // migrated to GameEngineV2 (BasicShipMove signal)
    // new ResolveAttackStep(), // migrated to GameEngineV2 (BasicShipAttack signal)
];
