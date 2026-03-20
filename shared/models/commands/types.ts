import { IGame, IGameManager, IGameStateManager } from "../../types";

export const CommandType = {
    Client: "Client",
    Server: "Server",
};

export type TCommandType = keyof typeof CommandType;

export interface ICommandExecutionParams {
    currentPlayerId: string;
    gsm?: IGameStateManager;
    game: IGame;
    db: IGameManager;
}

export interface ICommand {
    commandType: TCommandType;
    execute(params: ICommandExecutionParams): Promise<void>;
    undo(params: ICommandExecutionParams): Promise<void>;
}

export interface IFECommand extends ICommand {
    commandType: "Client";
}