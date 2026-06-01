import { ActionTypes, IGameState, IPlayerAction } from "../../../../types";
import { IResolveStepContext, ResolveAttackStep, ResolveDeployStep, ResolveMoveStep, createResolvePipeline } from "..";

const tag = (name: string) => ({ tag: name }) as unknown as IGameState;
const actionOf = (type: string) => ({ type }) as unknown as IPlayerAction;

class FakeCtx implements IResolveStepContext {
    public gameState: IGameState = tag("initial");
    public calls: string[] = [];
    resolveDeploy(): IGameState {
        this.calls.push("deploy");
        return tag("deploy");
    }
    resolveMove(): IGameState {
        this.calls.push("move");
        return tag("move");
    }
    resolveAttack(): IGameState {
        this.calls.push("attack");
        return tag("attack");
    }
}

describe("resolve steps (isolation)", () => {
    // The step classes are retained (commented out of the pipeline) as templates
    // for the non-engine resolution pattern; their isolation behaviour still holds.
    const cases = [
        { step: new ResolveDeployStep(), type: ActionTypes.DEPLOY, call: "deploy" },
        { step: new ResolveMoveStep(), type: ActionTypes.MOVE, call: "move" },
        { step: new ResolveAttackStep(), type: ActionTypes.ATTACK, call: "attack" },
    ];

    it("each step resolves only its own action type and updates gameState", () => {
        for (const { step, type, call } of cases) {
            const ctx = new FakeCtx();
            step.resolve(actionOf(type), ctx);
            expect(ctx.calls).toEqual([call]);
            expect(ctx.gameState).toEqual(tag(call));
        }
    });

    it("each step is a no-op for a non-matching action type", () => {
        for (const { step } of cases) {
            const ctx = new FakeCtx();
            step.resolve(actionOf("SOME_OTHER_TYPE"), ctx);
            expect(ctx.calls).toEqual([]);
            expect(ctx.gameState).toEqual(tag("initial"));
        }
    });
});

describe("createResolvePipeline", () => {
    it("is empty — every action type now resolves through GameEngineV2 in resolveAction", () => {
        expect(createResolvePipeline()).toEqual([]);
    });
});
