import { IGame, IGameStateManager } from "../../types";

export const CommandType = {
    Client: "Client",
    Server: "Server",
};

export type TCommandType = keyof typeof CommandType;

export interface ICommandExecutionParams {
    currentPlayerId: string;
    gsm?: IGameStateManager;
    game: IGame;
}

export interface ICommand {
    execute(params: ICommandExecutionParams): Promise<void>;
    undo(params: ICommandExecutionParams): Promise<void>;
}
