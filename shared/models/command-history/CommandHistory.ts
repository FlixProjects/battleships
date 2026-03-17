import { IGame } from "../../types";
import { ICommand } from "../commands/types";
import { ICommandHistory } from "./types";

export class CommandHistory implements ICommandHistory {
    public currentStep: number = -1;
    public history: ICommand[] = [];

    constructor(private game: IGame) {}

    get lastIndex() {
        return this.history.length - 1;
    }

    /**
     * Does not run the command!
     */
    public push(command: ICommand) {
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
        this.game.undo(poppedCommand);
        this.currentStep--;
        return this;
    }

    public forward() {
        if (this.currentStep === this.lastIndex) {
            return this;
        }
        this.currentStep++;
        this.game.run(this.history[this.currentStep]);
        return this;
    }

    public back() {
        if (this.currentStep === -1) {
            return this;
        }
        this.game.undo(this.history[this.currentStep]);
        this.currentStep--;
        return this;
    }
}
