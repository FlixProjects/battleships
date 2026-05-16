import { ActionTypes, IMoveAction, IPlayerAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

export class ResolveMoveStep implements IResolveStep {
    public readonly name = "ResolveMove";

    resolve(action: IPlayerAction, ctx: IResolveStepContext): void {
        if (action.type !== ActionTypes.MOVE) return;
        ctx.gameState = ctx.resolveMove(action as IMoveAction) ?? ctx.gameState;
    }
}
