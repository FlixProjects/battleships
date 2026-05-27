import { ISignalHandleCtx } from "@shared/types/types";
import { ISignal, SignalType } from "../signals/types";

export interface IListener {
    id: string;
    signalTypes: SignalType[];
    handleSignal: TListenerCallback;
    overrideCallback(fn: TListenerCallback): void;
}

export type TListenerCallback = (ctx: ISignalHandleCtx) => void;
export type TListenerId = string;
export interface IListenerOptions {
    removeOnSignalHandled?: boolean;
}

export interface IListenerManager {
    listeners: Map<TListenerId, { listener: IListener; options: IListenerOptions }>;
    addListener(listener: IListener, options?: IListenerOptions): this;
    removeListener(listenerId: TListenerId): this;
    overrideSignalListener(signalType: SignalType, newCallback: TListenerCallback): this;
    overrideListener(listenerId: TListenerId, newCallback: TListenerCallback): this;
}
