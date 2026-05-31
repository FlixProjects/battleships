import {
    IBasicShipAttackSignalHandleCtx,
    IPlayerSpendCommandPointsSignalHandleCtx,
    IReceiveShipAttackSignalHandleCtx,
    ISignalHandleCtx,
} from "@shared/types/types";
import { SignalType } from "../signals/types";

export type SignalCtxMap = {
    [SignalType.BasicShipAttack]: IBasicShipAttackSignalHandleCtx;
    [SignalType.ReceiveShipAttack]: IReceiveShipAttackSignalHandleCtx;
    [SignalType.PlayerSpendCommandPoints]: IPlayerSpendCommandPointsSignalHandleCtx;
};

export type TListenerCallback<T extends SignalType = SignalType> = (ctx: SignalCtxMap[T]) => void;

export interface IListener<T extends SignalType = SignalType> {
    id: string;
    signalTypes: SignalType[];
    handleSignal(ctx: ISignalHandleCtx): void;
    overrideCallback(fn: TListenerCallback<T>): void;
}

export type TListenerId = string;
export interface IListenerOptions {
    removeOnSignalHandled?: boolean;
}

export interface IListenerManager {
    listeners: Map<TListenerId, { listener: IListener; options: IListenerOptions }>;
    addListener(listener: IListener, options?: IListenerOptions): this;
    removeListener(listenerId: TListenerId): this;
    overrideSignalListener<T extends SignalType>(signalType: T, newCallback: TListenerCallback<T>): this;
    overrideListener<T extends SignalType>(listenerId: TListenerId, newCallback: TListenerCallback<T>): this;
}
