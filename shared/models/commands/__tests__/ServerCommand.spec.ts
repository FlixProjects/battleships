import * as fs from "fs";
import * as path from "path";
import { IActionResolver, IGameManager, IGameState, IGameStateManager, IPlayerAction } from "../../../types";
import { ServerMoveCommand } from "../ServerMoveCommand";
import { ServerPlayCardCommand } from "../ServerPlayCardCommand";
import { ICommandExecutionParams } from "../types";

const buildParams = () => {
    const plain = { code: "g1" };
    const saved: unknown[] = [];
    let resolvedAction: IPlayerAction | undefined;

    const params = {
        currentPlayerId: "p1",
        gsm: {
            getPlayer: (id: string) => ({ id, pendingActions: [] as IPlayerAction[] }),
            getCurrentRound: () => 3,
        } as unknown as IGameStateManager,
        db: { saveAppState: (s: unknown) => saved.push(s) } as unknown as IGameManager,
        resolver: {
            resolveAction: (a: IPlayerAction) => {
                resolvedAction = a;
                return { toPlain: () => plain } as unknown as IGameState;
            },
        } as unknown as IActionResolver,
    } as ICommandExecutionParams;

    return { params, plain, saved, getResolvedAction: () => resolvedAction };
};

describe("ServerCommand (game-logic only)", () => {
    it("builds the action, runs the pipeline, persists once, returns no children", async () => {
        const { params, plain, saved, getResolvedAction } = buildParams();
        const cmd = new ServerMoveCommand({
            playerId: "p1",
            shipId: "s1",
            targetCell: [0, 0],
            commandPointCost: 2,
        });

        const children = await cmd.execute(params);

        expect(getResolvedAction()).toMatchObject({ type: "move", shipId: "s1", playerId: "p1", commandPointCost: 2 });
        expect(saved).toEqual([{ gameState: plain }]); // persisted exactly once, via IGameManager
        expect(children).toBeUndefined(); // logic-only: no FE follow-ups (those are sibling FE*Commands)
    });

    it("ServerPlayCardCommand builds a play_card action with its payload", async () => {
        const { params, getResolvedAction } = buildParams();
        const cmd = new ServerPlayCardCommand({
            playerId: "p1",
            cardId: "c1",
            commandPointCost: 1,
            payload: { kind: "Ship", location: [0, 0] },
        });

        await cmd.execute(params);

        expect(getResolvedAction()).toMatchObject({ type: "play_card", cardId: "c1", playerId: "p1" });
    });
});

describe("ServerCommand dependency guard (Decision 5)", () => {
    const files = ["ServerCommand.ts", "ServerMoveCommand.ts", "ServerAttackCommand.ts", "ServerPlayCardCommand.ts"];

    it("no ServerCommand file imports src/ or touches browser globals", () => {
        for (const file of files) {
            const src = fs.readFileSync(path.join(__dirname, "..", file), "utf-8");
            expect(src).not.toMatch(/from\s+["'][^"']*\/src\//);
            expect(src).not.toMatch(/\b(window|document|sessionStorage|localStorage)\s*[.[]/);
        }
    });
});
