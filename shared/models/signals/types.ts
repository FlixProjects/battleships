import { ICellLoc } from "@shared/types/types";
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
    PlayerSpendCommandPoints: "PlayerSpendCommandPoints",
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

export interface IPlayerSpendCommandPointsSignalPayload extends ISignalPayload {
    playerId: string;
    amount: number;
}

export interface IAttackPayload {
    shipId: string;
    hullId: string;
    attackDamage: number;
    onHit?: (attackedShip: Ship) => void;
}
