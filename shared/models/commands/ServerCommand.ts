import { IGameState, IPlayerAction, ITurnEvent } from "../../types";
import { Command } from "./Command";
import { CommandType, ICommand, ICommandExecutionParams } from "./types";

/**
 * Maps the pipeline's turn-event stream to follow-up commands. Injected at the
 * composition root: the browser injects an FE translator producing `FE*`
 * commands; non-UI hosts (Lambda, future Node backend) inject one returning
 * `[]`. `ServerCommand` depends only on this interface — never the concrete FE
 * translator, the DOM, `window`, `sessionStorage`, or anything in `src/`.
 */
export interface IServerCommandEventConsumer {
    toCommands(events: ITurnEvent[]): ICommand[];
}

/** Non-UI consumer: produces no follow-up commands. */
export class NoopEventConsumer implements IServerCommandEventConsumer {
    toCommands(): ICommand[] {
        return [];
    }
}

/**
 * Owns action creation + running the action through the uniform per-action
 * pipeline. `execute()` orchestrates, in order: core → persist via the
 * `IGameManager` interface → return the consumer's follow-up commands (`Game`
 * runs them after this command fully completes, so FE animations read
 * post-save state — Decision 4/5/6).
 *
 * Environment-agnostic: depends only on injected abstractions.
 */
export abstract class ServerCommand extends Command {
    public commandType = CommandType.Server as "Server";

    constructor(protected readonly consumer: IServerCommandEventConsumer) {
        super();
    }

    /** Build the player action this command represents (via a `*ActionCreator`). */
    protected abstract createAction(params: ICommandExecutionParams): IPlayerAction;

    public async execute(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        const action = this.createAction(params);
        const { newGameState, events } = this.core(action, params);
        params.db.saveAppState({ gameState: newGameState.toPlain() });
        return this.consumer.toCommands(events);
    }

    /**
     * Pure resolution: run the action through the per-action pipeline.
     */
    protected core(
        action: IPlayerAction,
        params: ICommandExecutionParams,
    ): { newGameState: IGameState; events: ITurnEvent[] } {
        const newGameState = params.resolver.resolveAction(action);
        return { newGameState, events: [] };
    }

    public async undo(_params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // Deferred: restore pre-execute() gameState via CommandHistory (Decision 6 / C3).
    }
}
