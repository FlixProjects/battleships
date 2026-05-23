import { ISignalHandleCtx } from "@shared/types/types";
import { ISignal, SignalType } from "../signals/types";

export interface IListener {
    id: string;
    signalTypes: SignalType[];
    handleSignal: TListenerCallback;
    overrideCallback(fn: TListenerCallback): void;
}

export type TListenerCallback = (signal: ISignal, ctx: ISignalHandleCtx) => void;
