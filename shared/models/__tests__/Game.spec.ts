import { IActionResolver, IGameManager, IGameState, IGameStateManager } from "../../types";
import { ICommand } from "../commands/types";
import { Game } from "../Game";

// Records the order in which commands are run so we can assert the
// parent-then-children depth-first traversal of Game.runCommandTree.
class RecordingCommand implements ICommand {
    public commandType = "Client" as const;

    constructor(
        private id: string,
        private order: string[],
        private children: ICommand[] = [],
    ) {}

    async execute(): Promise<ICommand[]> {
        this.order.push(this.id);
        return this.children;
    }

    async undo(): Promise<void> {}
}

// Game only touches db.getCurrentPlayerId() and db.state.gameState; the GSM /
// Resolver are constructed but never used by these commands, so trivial stubs
// are sufficient.
const makeGame = () => {
    const db = {
        getCurrentPlayerId: () => "p1",
        state: { gameState: {} as IGameState },
    } as unknown as IGameManager;
    const GSM = class {} as unknown as new (gs: IGameState) => IGameStateManager;
    const Resolver = class {} as unknown as new (pid: string, gs: IGameState) => IActionResolver;
    return new Game(db, GSM, Resolver);
};

describe("Game.runCommandTree", () => {
    it("runs a parent, then its returned children, depth-first in order", async () => {
        const order: string[] = [];
        const grandchild = new RecordingCommand("grandchild", order);
        const childA = new RecordingCommand("childA", order, [grandchild]);
        const childB = new RecordingCommand("childB", order);
        const root = new RecordingCommand("root", order, [childA, childB]);

        await makeGame().runCommandTree(root);

        expect(order).toEqual(["root", "childA", "grandchild", "childB"]);
    });

    it("runs no children when execute returns void", async () => {
        const order: string[] = [];

        class VoidCommand implements ICommand {
            public commandType = "Client" as const;
            async execute(): Promise<void> {
                order.push("void");
            }
            async undo(): Promise<void> {}
        }

        await makeGame().runCommandTree(new VoidCommand());

        expect(order).toEqual(["void"]);
    });
});
