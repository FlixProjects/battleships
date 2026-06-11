import { IGameState, IPlayerAction } from "../../types";
import { Command } from "./Command";
import { CommandType, ICommand, ICommandExecutionParams } from "./types";

/**
 * Environment-agnostic (no FE/DOM/`src` — dependency-guard tested): running
 * only the `Server*Command`s on any host reproduces the identical `GameState`.
 */
export abstract class ServerCommand extends Command {
    public commandType = CommandType.Server as "Server";

    /** Build the player action this command represents (via a `*ActionCreator`). */
    protected abstract createAction(params: ICommandExecutionParams): IPlayerAction;

    public async execute(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        const action = this.createAction(params);
        const newGameState = this.core(action, params);
        params.db.saveAppState({ gameState: newGameState.toPlain() });
    }

    protected core(action: IPlayerAction, params: ICommandExecutionParams): IGameState {
        return params.resolver.resolveAction(action);
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // Deferred: restore pre-execute() gameState via CommandHistory (Decision 6 / C3).
    }
}
