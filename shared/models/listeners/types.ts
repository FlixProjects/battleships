import {
    IBasicShipAttackSignalHandleCtx,
    IBasicShipDeploySignalHandleCtx,
    IBasicShipMoveSignalHandleCtx,
    IDeckAddToPlayedSignalHandleCtx,
    IEffectAttackLocationSignalHandleCtx,
    IReceiveEffectAttackLocationSignalHandleCtx,
    IGameCreateEffectSignalHandleCtx,
    IGameCreateHullSignalHandleCtx,
    IGameProjectVisibilitySignalHandleCtx,
    IGetValidAttackCellsQueryCtx,
    IGetValidDeployCellsQueryCtx,
    IGetValidMoveCellsQueryCtx,
    IGetValidMoveRoutesQueryCtx,
    IGetValidSupportCellsQueryCtx,
    IHullDestroyedSignalHandleCtx,
    IHullMoveSignalHandleCtx,
    IHullReceiveAttackSignalHandleCtx,
    IHullReceiveDamageSignalHandleCtx,
    IPlayCardSignalHandleCtx,
    IPlayerRemoveCardFromHandSignalHandleCtx,
    IPlayerSpendCommandPointsSignalHandleCtx,
    IReceiveShipAttackSignalHandleCtx,
    IGameRefillHandsSignalHandleCtx,
    IGameRemoveSubmissionCommandPointsSignalHandleCtx,
    ISignalHandleCtx,
    ISignalHandleCtxBase,
    IPlayerGainCommandPointsSignalHandleCtx,
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
    [SignalType.GameCreateHull]: IGameCreateHullSignalHandleCtx;
    [SignalType.PlayerSpendCommandPoints]: IPlayerSpendCommandPointsSignalHandleCtx;
    [SignalType.PlayerGainCommandPoints]: IPlayerGainCommandPointsSignalHandleCtx;
    [SignalType.PlayCard]: IPlayCardSignalHandleCtx;
    [SignalType.PlayerRemoveCardFromHand]: IPlayerRemoveCardFromHandSignalHandleCtx;
    [SignalType.DeckAddToPlayed]: IDeckAddToPlayedSignalHandleCtx;
    [SignalType.GameCreateEffect]: IGameCreateEffectSignalHandleCtx;
    [SignalType.GamePersistentEffectsTick]: ISignalHandleCtx;
    [SignalType.GameWinnerDetermined]: ISignalHandleCtx;
    [SignalType.GameRotateInitiative]: ISignalHandleCtx;
    [SignalType.GameRemoveSubmissionCommandPoints]: IGameRemoveSubmissionCommandPointsSignalHandleCtx;
    [SignalType.GameRemoveExpiredEffects]: ISignalHandleCtx;
    [SignalType.GameRefillHands]: IGameRefillHandsSignalHandleCtx;
    [SignalType.GameProjectVisibility]: IGameProjectVisibilitySignalHandleCtx;
    [SignalType.EffectAttackLocation]: IEffectAttackLocationSignalHandleCtx;
    [SignalType.ReceiveEffectAttackLocation]: IReceiveEffectAttackLocationSignalHandleCtx;
    [SignalType.GetValidDeployCells]: IGetValidDeployCellsQueryCtx;
    [SignalType.GetValidMoveCells]: IGetValidMoveCellsQueryCtx;
    [SignalType.GetValidMoveRoutes]: IGetValidMoveRoutesQueryCtx;
    [SignalType.GetValidAttackCells]: IGetValidAttackCellsQueryCtx;
    [SignalType.GetValidSupportCells]: IGetValidSupportCellsQueryCtx;
};

export type TListenerCallback<T extends SignalType = SignalType> = (ctx: SignalCtxMap[T]) => void;

export interface IListener<T extends SignalType = SignalType> {
    id: string;
    signalTypes: SignalType[];
    handleSignal(ctx: ISignalHandleCtxBase): void;
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
