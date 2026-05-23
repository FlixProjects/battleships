import { ISignalHandleCtx } from "@shared/types/types";
import { ISignal } from "../signals/types";

export abstract class SignalHandler {
    abstract handle(signal: ISignal, ctx: ISignalHandleCtx): void;
}
