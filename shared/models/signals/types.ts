import { TPlayCardPayload } from "@shared/types/action-types";
import { ICellLoc, IEffect, IHull } from "@shared/types/types";
import type { Attack } from "../Attack";
import type { Ship } from "../Ship";

export interface ISignal {
    id: string;
    type: SignalType;
    senderId: string;
    targetId?: string;
    originId: string;
    payload?: ISignalPayload;
}

export const SignalType = {
    BasicShipAttack: "BasicShipAttack",
    ReceiveShipAttack: "ReceiveShipAttack",
    BasicShipMove: "BasicShipMove",
    BasicShipDeploy: "BasicShipDeploy",
    HullReceiveAttack: "HullReceiveAttack",
    HullReceiveDamage: "HullReceiveDamage",
    HullMove: "HullMove",
    HullDestroyed: "HullDestroyed",
    GameCreateHull: "GameStateCreateHull",
    PlayerSpendCommandPoints: "PlayerSpendCommandPoints",
    PlayerGainCommandPoints: "PlayerGainCommandPoints",
    PlayCard: "PlayCard",
    PlayerRemoveCardFromHand: "PlayerRemoveCardFromHand",
    DeckAddToPlayed: "DeckAddToPlayed",
    GameCreateEffect: "GameCreateEffect",
    GamePersistentEffectsTick: "GamePersistentEffectsTick",
    GameWinnerDetermined: "GameWinnerDetermined",
    GameRotateInitiative: "GameRotateInitiative",
    GameRemoveSubmissionCommandPoints: "GameRemoveSubmissionCommandPoints",
    GameRemoveExpiredEffects: "GameRemoveExpiredEffects",
    GameRefillHands: "GameRefillHands",
    GameProjectVisibility: "GameProjectVisibility",
    GetValidDeployCells: "GetValidDeployCells",
    GetValidMoveCells: "GetValidMoveCells",
    GetValidMoveRoutes: "GetValidMoveRoutes",
    GetValidAttackCells: "GetValidAttackCells",
    GetValidSupportCells: "GetValidSupportCells",
} as const;

export type SignalType = (typeof SignalType)[keyof typeof SignalType];

export interface ISignalPayload {}

export interface IShipAttackSignalPayload extends ISignalPayload {
    attackingShipId: string;
    attackLocations: ICellLoc[];
}
export interface IShipReceiveAttackSignalPayload extends ISignalPayload {
    attackingShipId: string;
    attackedShipId: string;
    attacks: Attack[];
}

export interface IShipMoveSignalPayload extends ISignalPayload {
    shipId: string;
    targetCell: ICellLoc;
    route?: ICellLoc[];
}

export interface IShipDeploySignalPayload extends ISignalPayload {
    shipId: string;
    location: ICellLoc;
}

export interface IHullReceiveAttackSignalPayload extends ISignalPayload {
    hullId: string;
    attack: Attack;
}

export interface IHullReceiveDamageSignalPayload extends ISignalPayload {
    hullId: string;
    attack: Attack;
}

export interface IHullMoveSignalPayload extends ISignalPayload {
    hullId: string;
    location: ICellLoc;
    orientation: number;
}

export interface IHullDestroyedSignalPayload extends ISignalPayload {
    hullId: string;
    shipId: string;
}

export interface IGameCreateHullSignalPayload extends ISignalPayload {
    hull: IHull;
    shipId: string;
}

export interface IPlayerSpendCommandPointsSignalPayload extends ISignalPayload {
    playerId: string;
    amount: number;
}

export interface IPlayerGainCommandPointsSignalPayload extends ISignalPayload {
    playerId: string;
    amount: number;
}

export interface IPlayCardSignalPayload extends ISignalPayload {
    playerId: string;
    cardPayload: TPlayCardPayload;
}

export interface IPlayerRemoveCardFromHandSignalPayload extends ISignalPayload {
    playerId: string;
    cardId: string;
}

export interface IDeckAddToPlayedSignalPayload extends ISignalPayload {
    deckId: string;
    cardId: string;
}

export interface IGameCreateEffectSignalPayload extends ISignalPayload {
    effect: IEffect;
}

export interface IGameRemoveSubmissionCommandPointsSignalPayload extends ISignalPayload {
    playerId: string;
}

export interface IGameRefillHandsSignalPayload extends ISignalPayload {
    maxHandSize: number;
}

export interface IGameProjectVisibilitySignalPayload extends ISignalPayload {
    visibleTiles: Set<string>;
}

export interface IAttackPayload {
    shipId: string;
    hullId: string;
    attackDamage: number;
    onHit?: (attackedShip: Ship) => void;
}

// ===============================================================================
// Query signals — read-only "where can I act?" lookups. Single-hop: the handler
// computes via the target domain method and calls ctx.resolve(result); it never
// mutates state or emits follow-ups.
// ===============================================================================

export interface IGetValidDeployCellsQueryPayload extends ISignalPayload {
    shipId: string;
    playerId: string;
}
export interface IGetValidMoveCellsQueryPayload extends ISignalPayload {
    shipId: string;
    playerId: string;
}
export interface IGetValidMoveRoutesQueryPayload extends ISignalPayload {
    shipId: string;
    playerId: string;
    destinationTileId: string;
}
export interface IGetValidAttackCellsQueryPayload extends ISignalPayload {
    shipId: string;
    playerId: string;
}
export interface IGetValidSupportCellsQueryPayload extends ISignalPayload {
    cardId: string;
    playerId: string;
    effectIndex: number;
}

export interface IGetValidDeployCellsQueryResult {
    validCells: ICellLoc[];
}
export interface IGetValidMoveCellsQueryResult {
    validCells: ICellLoc[];
    origin: ICellLoc;
}
export interface IGetValidMoveRoutesQueryResult {
    routes: ICellLoc[][];
}
export interface IGetValidAttackCellsQueryResult {
    validCells: ICellLoc[];
    origin: ICellLoc;
}
export interface IGetValidSupportCellsQueryResult {
    validCells: ICellLoc[];
    /** When the Effect's range is 0 (untargeted) the caller renders a confirm prompt instead. */
    requiresTarget: boolean;
}

export interface SignalResultMap {
    [SignalType.GetValidDeployCells]: IGetValidDeployCellsQueryResult;
    [SignalType.GetValidMoveCells]: IGetValidMoveCellsQueryResult;
    [SignalType.GetValidMoveRoutes]: IGetValidMoveRoutesQueryResult;
    [SignalType.GetValidAttackCells]: IGetValidAttackCellsQueryResult;
    [SignalType.GetValidSupportCells]: IGetValidSupportCellsQueryResult;
}

export type TQuerySignalType = keyof SignalResultMap;
export type TQueryResult = SignalResultMap[TQuerySignalType];

export interface IQuerySignal<K extends TQuerySignalType = TQuerySignalType> extends ISignal {
    type: K;
}
