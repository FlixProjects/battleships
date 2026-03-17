import { ICommand, ICommandExecutionParams } from "./types";

export abstract class Command implements ICommand {
    abstract execute(params: ICommandExecutionParams): Promise<void>;
    abstract undo(params: ICommandExecutionParams): Promise<void>;
}
