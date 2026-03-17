import { IAppState, IGameState, IGameStateManager } from "../types";
import { ICommand } from "./commands/types";

interface IQueueCommand {
    command: ICommand;
    executeNext(): Promise<void>;
}

export class Game {
    private commandQueue: IQueueCommand[] = [];

    constructor(
        private db: { state: IAppState; getCurrentPlayerId: () => string },
        private GSM: new (_gameState: IGameState) => IGameStateManager,
    ) {}

    public queueCommand(command: ICommand): void {
        // Implementation for queuing commands
        this.commandQueue.push({
            command,
            executeNext: async () => await this.runNextCommandInQueue(),
        });
    }

    public async run(command: ICommand) {
        const gsm = new this.GSM(this.db.state.gameState);
        await command.execute({
            currentPlayerId: this.db.getCurrentPlayerId(),
            gsm,
            game: this,
        });
    }

    public async undo(command: ICommand) {
        const gsm = new this.GSM(this.db.state.gameState);
        await command.undo({
            currentPlayerId: this.db.getCurrentPlayerId(),
            gsm,
            game: this,
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
