import { IActionResolver, IGameManager, IGameState, IGameStateManager } from "../types";
import { ICommand } from "./commands/types";

interface IQueueCommand {
    command: ICommand;
    executeNext(): Promise<void>;
}

export class Game {
    private commandQueue: IQueueCommand[] = [];

    constructor(
        private db: IGameManager,
        private GSM: new (_gameState: IGameState) => IGameStateManager,
        private Resolver: new (playerId: string, gameState: IGameState) => IActionResolver,
    ) {}

    // for now, runs the command immediately if the queue is empty, otherwise queues it
    public async queueCommand(command: ICommand): Promise<void> {
        // Implementation for queuing commands
        this.commandQueue.push({
            command,
            executeNext: async () => await this.runNextCommandInQueue(),
        });
        if (this.commandQueue.length === 1) {
            await this.runNextCommandInQueue();
        }
    }

    public async run(command: ICommand) {
        const currentPlayerId = this.db.getCurrentPlayerId();
        const gameState = this.db.state.gameState;
        const gsm = new this.GSM(gameState);
        const resolver = new this.Resolver(currentPlayerId, gameState);
        await command.execute({
            currentPlayerId,
            gsm,
            game: this,
            db: this.db,
            resolver,
        });
    }

    public async undo(command: ICommand) {
        const currentPlayerId = this.db.getCurrentPlayerId();
        const gameState = this.db.state.gameState;
        const gsm = new this.GSM(gameState);
        const resolver = new this.Resolver(currentPlayerId, gameState);
        await command.undo({
            currentPlayerId,
            gsm,
            game: this,
            db: this.db,
            resolver,
        });
    }

    private async runNextCommandInQueue() {
        // Implementation for running the next command in the queue
        const queuedCommand = this.commandQueue.shift();
        if (queuedCommand) {
            await this.run(queuedCommand.command);
            await queuedCommand.executeNext();
        }
    }
}
