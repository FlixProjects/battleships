import { Command } from "../commands/Command";
import { ICommandHandler } from "./types";

export class CommandHandler implements ICommandHandler {
    public currentStep: number = -1;

    public history: Command[] = [];

    constructor() {}

    get lastIndex() {
        return this.history.length - 1;
    }

    /**
     * Does not run the command!
     */
    public push(command: Command) {
        if (this.currentStep !== this.lastIndex) {
            this.history = this.history.slice(0, this.currentStep + 1);
        }
        this.history.push(command);
        this.currentStep++;
        return this;
    }

    /**
     * Runs the command.undo()!
     */
    public pop() {
        if (this.history.length === 0) {
            return this;
        }
        const poppedCommand = this.history.pop();
        poppedCommand?.undo();
        this.currentStep--;
        return this;
    }

    public forward() {
        if (this.currentStep === this.lastIndex) {
            return this;
        }
        this.currentStep++;
        this.history[this.currentStep].execute();
        return this;
    }

    public back() {
        if (this.currentStep === -1) {
            return this;
        }
        this.history[this.currentStep].undo();
        this.currentStep--;
        return this;
    }
}
