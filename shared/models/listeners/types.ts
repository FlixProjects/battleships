import {
    IBasicShipAttackSignalHandleCtx,
    IBasicShipDeploySignalHandleCtx,
    IBasicShipMoveSignalHandleCtx,
    IDeckAddToPlayedSignalHandleCtx,
    IGameStateCreateEffectSignalHandleCtx,
    IGameStateCreateHullSignalHandleCtx,
    IHullDestroyedSignalHandleCtx,
    IHullMoveSignalHandleCtx,
    IHullReceiveAttackSignalHandleCtx,
    IHullReceiveDamageSignalHandleCtx,
    IPlayCardSignalHandleCtx,
    IPlayerRemoveCardFromHandSignalHandleCtx,
    IPlayerSpendCommandPointsSignalHandleCtx,
    IReceiveShipAttackSignalHandleCtx,
    ISignalHandleCtx,
} from "@shared/types/types";
import { SignalType } from "../signals/types";

export type SignalCtxMap = {
    [SignalType.BasicShipAttack]: IBasicShipAttackSignalHandleCtx;
    [SignalType.ReceiveShipAttack]: IReceiveShipAttackSignalHandleCtx;
    [SignalType.BasicShipMove]: IBasicShipMoveSignalHandleCtx;
    [SignalType.BasicShipDeploy]: IBasicShipDeploySignalHandleCtx;
    [SignalType.HullReceiveAttack]: IHullReceiveAttackSignalHandleCtx;
    [SignalType.HullReceiveDamage]: IHullReceiveDamageSignalHandleCtx;
    [SignalType.HullMove]: IHullMoveSignalHandleCtx;
    [SignalType.HullDestroyed]: IHullDestroyedSignalHandleCtx;
    [SignalType.GameStateCreateHull]: IGameStateCreateHullSignalHandleCtx;
    [SignalType.PlayerSpendCommandPoints]: IPlayerSpendCommandPointsSignalHandleCtx;
    [SignalType.PlayCard]: IPlayCardSignalHandleCtx;
    [SignalType.PlayerRemoveCardFromHand]: IPlayerRemoveCardFromHandSignalHandleCtx;
    [SignalType.DeckAddToPlayed]: IDeckAddToPlayedSignalHandleCtx;
    [SignalType.GameStateCreateEffect]: IGameStateCreateEffectSignalHandleCtx;
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
