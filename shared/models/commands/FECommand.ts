import type { IFECommandExecutionParams } from "../../../src/types/commands/types";
import { Command } from "./Command";
import { CommandType, ICommand, IFECommand } from "./types";

export abstract class FECommand extends Command implements IFECommand {
    public commandType = CommandType.Client as "Client";

    abstract execute(params: IFECommandExecutionParams): Promise<ICommand[] | void>;
    abstract undo(params: IFECommandExecutionParams): Promise<ICommand[] | void>;

    public logExecution() {
        console.log(`${this.constructor.name} executed`);
    }
}
