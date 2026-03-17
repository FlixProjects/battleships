import { IGameStateManager } from "../../types";

export abstract class Command {
    abstract execute(gsm?: IGameStateManager): void;
    abstract undo(gsm?: IGameStateManager): void;
}
