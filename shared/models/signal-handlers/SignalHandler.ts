import { ISignalHandleCtx } from "@shared/types/types";

export abstract class SignalHandler {
    abstract handle(ctx: ISignalHandleCtx): void;
}
