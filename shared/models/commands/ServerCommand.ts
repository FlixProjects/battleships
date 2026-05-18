import { IGameState, IPlayerAction } from "../../types";
import { Command } from "./Command";
import { CommandType, ICommand, ICommandExecutionParams } from "./types";

/**
 * The game-logic half of a player action, decoupled from presentation:
 * create the action → run it through the per-action pipeline → persist via the
 * injected `IGameManager`. Returns no children — animation/render is a
 * separate sibling `FE*Command`.
 *
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

    /** Pure resolution: run the action through the per-action pipeline. No
     *  persistence, no browser deps. */
    protected core(action: IPlayerAction, params: ICommandExecutionParams): IGameState {
        return params.resolver.resolveAction(action);
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // Deferred: restore pre-execute() gameState via CommandHistory (Decision 6 / C3).
    }
}
