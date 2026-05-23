import type { Action } from "@shared/models";
import type { Signal } from "@shared/models/signals/Signal";

export abstract class ActionSignalCreator {
    // Signals emitted are on the same level
    abstract createIfValid(action: Action): Signal[];
}
