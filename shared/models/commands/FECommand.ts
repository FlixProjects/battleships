import { Command } from "./Command";
import { CommandType, IFECommand } from "./types";

export abstract class FECommand extends Command implements IFECommand {
    public commandType = CommandType.Client as "Client";

    public logExecution() {
        console.log(`${this.constructor.name} executed`);
    }
}
