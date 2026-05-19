import { CommandType, ICommand, ICommandExecutionParams, TCommandType } from "./types";

export abstract class Command implements ICommand {
    public commandType: TCommandType = CommandType.Server as "Server";
    abstract execute(params: ICommandExecutionParams): Promise<ICommand[] | void>;
    abstract undo(params: ICommandExecutionParams): Promise<ICommand[] | void>;
}
