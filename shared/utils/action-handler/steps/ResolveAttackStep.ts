import { ActionTypes, IPlayerAction, IShipAttackAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

export class ResolveAttackStep implements IResolveStep {
    public readonly name = "ResolveAttack";

    resolve(action: IPlayerAction, ctx: IResolveStepContext): void {
        if (action.type !== ActionTypes.ATTACK) return;
        ctx.gameState = ctx.resolveAttack(action as IShipAttackAction) ?? ctx.gameState;
    }
}
