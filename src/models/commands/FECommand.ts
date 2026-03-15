import { Command } from "./Command";
import { CommandType } from "./types";

export abstract class FECommand extends Command {
    protected commandType = CommandType.Client;
}
