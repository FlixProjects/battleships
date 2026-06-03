import { TPlayCardPayload } from "@shared/types/action-types";
import { ICellLoc, IEffect, IHull } from "@shared/types/types";
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
    GameStateCreateHull: "GameStateCreateHull",
    PlayerSpendCommandPoints: "PlayerSpendCommandPoints",
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
    attacks: IAttackPayload[];
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
    attackDamage: number;
}

export interface IHullReceiveDamageSignalPayload extends ISignalPayload {
    hullId: string;
    amount: number;
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

export interface IAttackPayload {
    shipId: string;
    hullId: string;
    attackDamage: number;
    onHit?: (attackedShip: Ship) => void;
}
