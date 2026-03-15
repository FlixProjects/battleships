import { Command } from "../commands/Command";

export interface ICommandHandler {
    currentStep: number;
    history: Command[];
    lastIndex: number;
    push(command: Command): this;
    pop(): this;
    forward(): this;
    back(): this;
}
