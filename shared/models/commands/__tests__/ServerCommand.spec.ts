import * as fs from "fs";
import * as path from "path";
import { IActionResolver, IGameManager, IGameState, IGameStateManager, IPlayerAction } from "../../../types";
import { IServerCommandEventConsumer, NoopEventConsumer } from "../ServerCommand";
import { ServerMoveCommand } from "../ServerMoveCommand";
import { ServerPlayCardCommand } from "../ServerPlayCardCommand";
import { ICommand, ICommandExecutionParams } from "../types";

const marker: ICommand = { commandType: "Client", execute: async () => {}, undo: async () => {} };

class SpyConsumer implements IServerCommandEventConsumer {
    public received: unknown;
    toCommands(events: unknown): ICommand[] {
        this.received = events;
        return [marker];
    }
}

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

describe("ServerCommand.execute orchestration", () => {
    it("builds the action, runs the pipeline, persists once, returns consumer output", async () => {
        const { params, plain, saved, getResolvedAction } = buildParams();
        const consumer = new SpyConsumer();
        const cmd = new ServerMoveCommand(consumer, {
            playerId: "p1",
            shipId: "s1",
            hullLocations: [],
            commandPointCost: 2,
        });

        const children = await cmd.execute(params);

        expect(getResolvedAction()).toMatchObject({ type: "move", shipId: "s1", playerId: "p1", commandPointCost: 2 });
        expect(saved).toEqual([{ gameState: plain }]); // persisted exactly once, via IGameManager
        expect(children).toEqual([marker]); // returns the consumer's follow-up commands
        expect(consumer.received).toEqual([]); // events empty until Step 9
    });

    it("ServerPlayCardCommand builds a play_card action with its payload", async () => {
        const { params, getResolvedAction } = buildParams();
        const cmd = new ServerPlayCardCommand(new NoopEventConsumer(), {
            playerId: "p1",
            cardId: "c1",
            commandPointCost: 1,
            payload: { kind: "Ship", hullLocations: [] },
        });

        const children = await cmd.execute(params);

        expect(getResolvedAction()).toMatchObject({ type: "play_card", cardId: "c1", playerId: "p1" });
        expect(children).toEqual([]); // NoopEventConsumer → no follow-ups
    });
});

describe("ServerCommand dependency guard (Decision 5)", () => {
    const files = ["ServerCommand.ts", "ServerMoveCommand.ts", "ServerAttackCommand.ts", "ServerPlayCardCommand.ts"];

    it("no ServerCommand file imports src/ or touches browser globals", () => {
        for (const file of files) {
            const src = fs.readFileSync(path.join(__dirname, "..", file), "utf-8");
            // no import from anything under src/
            expect(src).not.toMatch(/from\s+["'][^"']*\/src\//);
            // no browser-global *usage* (member access / indexing) — prose
            // mentions in doc comments are fine, actual access is not
            expect(src).not.toMatch(/\b(window|document|sessionStorage|localStorage)\s*[.[]/);
        }
    });
});
