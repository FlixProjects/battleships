import { ActionTypes, IPlayCardAction, IPlayerAction } from "../../../types";
import { IResolveStep, IResolveStepContext } from "./types";

export class ResolvePlayCardStep implements IResolveStep {
    public readonly name = "ResolvePlayCard";

    resolve(action: IPlayerAction, ctx: IResolveStepContext): void {
        if (action.type !== ActionTypes.PLAY_CARD) return;
        ctx.gameState = ctx.resolvePlayCard(action as IPlayCardAction) ?? ctx.gameState;
    }
}
