import type { Signal } from "@shared/models/signals/Signal";
import { IAction } from "@shared/types";

// Only for Actions that emit Signals
// Signals emitted by other Signals do not need this
export abstract class ActionSignalCreator {
    // Signals emitted are on the same level
    abstract createIfValid(action: IAction): Signal[];
}
