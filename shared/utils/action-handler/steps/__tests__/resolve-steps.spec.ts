import { ActionTypes, IGameState, IPlayerAction } from "../../../../types";
import {
    IResolveStepContext,
    ResolveAttackStep,
    ResolveDeployStep,
    ResolveEffectsStep,
    ResolveMoveStep,
    ResolvePlayCardStep,
    createResolvePipeline,
} from "..";

const tag = (name: string) => ({ tag: name }) as unknown as IGameState;
const actionOf = (type: string) => ({ type }) as unknown as IPlayerAction;

class FakeCtx implements IResolveStepContext {
    public gameState: IGameState = tag("initial");
    public calls: string[] = [];
    resolvePlayCard(): IGameState {
        this.calls.push("playCard");
        return tag("playCard");
    }
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
    const cases = [
        { step: new ResolvePlayCardStep(), type: ActionTypes.PLAY_CARD, call: "playCard" },
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

    it("ResolveEffectsStep is a no-op for every action type (Step 8 fills it)", () => {
        const effects = new ResolveEffectsStep();
        for (const { type } of cases) {
            const ctx = new FakeCtx();
            effects.resolve(actionOf(type), ctx);
            expect(ctx.calls).toEqual([]);
            expect(ctx.gameState).toEqual(tag("initial"));
        }
    });
});

describe("createResolvePipeline", () => {
    it("is the fixed ordered set, no win-check step (winner stays turn-level)", () => {
        expect(createResolvePipeline().map((s) => s.name)).toEqual([
            "ResolvePlayCard",
            "ResolveDeploy",
            "ResolveMove",
            "ResolveAttack",
            "ResolveEffects",
        ]);
    });

    it("running the whole pipeline invokes exactly the matching resolver once", () => {
        const ctx = new FakeCtx();
        for (const step of createResolvePipeline()) {
            step.resolve(actionOf(ActionTypes.MOVE), ctx);
        }
        expect(ctx.calls).toEqual(["move"]);
        expect(ctx.gameState).toEqual(tag("move"));
    });
});
