import { ActionTypes, IDeployAction, IPlayerAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

export class ResolveDeployStep implements IResolveStep {
    public readonly name = "ResolveDeploy";

    resolve(action: IPlayerAction, ctx: IResolveStepContext): void {
        if (action.type !== ActionTypes.DEPLOY) return;
        ctx.gameState = ctx.resolveDeploy(action as IDeployAction) ?? ctx.gameState;
    }
}
