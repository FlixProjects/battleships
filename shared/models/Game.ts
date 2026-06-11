import { IActionResolver, IGameManager, IGameState, IGameStateManager } from "../types";
import { ICommand, ICommandExecutionParams } from "./commands/types";

export class Game {
    constructor(
        private db: IGameManager,
        private GSM: new (_gameState: IGameState) => IGameStateManager,
        private Resolver: new (playerId: string, gameState: IGameState) => IActionResolver,
    ) {}

    /**
     * Public entry point for callers (click handlers, helpers). Runs the
     * command and, depth-first, every child command it returns. `Game` is the
     * ONLY place a command is ever run — commands never run each other.
     */
    public async queueCommand(command: ICommand): Promise<void> {
        await this.runCommandTree(command);
    }

    public async runCommandTree(command: ICommand): Promise<void> {
        const children = await this.run(command);
        for (const child of children) {
            await this.runCommandTree(child);
        }
    }

    public async run(command: ICommand): Promise<ICommand[]> {
        const children = await command.execute(this.buildContext());
        return Array.isArray(children) ? children : [];
    }

    public async undo(command: ICommand): Promise<void> {
        const children = await command.undo(this.buildContext());
        for (const child of Array.isArray(children) ? children : []) {
            await this.runCommandTree(child);
        }
    }

    private buildContext(): ICommandExecutionParams {
        const currentPlayerId = this.db.getCurrentPlayerId();
        const gameState = this.db.state.gameState;
        return {
            currentPlayerId,
            gsm: new this.GSM(gameState),
            db: this.db,
            resolver: new this.Resolver(currentPlayerId, gameState),
        };
    }
}
