import { ICommand, ICommandExecutionParams, TCommandType } from "./types";

export abstract class Command implements ICommand {
    public commandType: TCommandType;
    abstract execute(params: ICommandExecutionParams): Promise<void>;
    abstract undo(params: ICommandExecutionParams): Promise<void>;
}
