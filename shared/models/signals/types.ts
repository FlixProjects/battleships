import { ICellLoc } from "@shared/types/types";
import type { Ship } from "../Ship";

export interface ISignal {
    id: string;
    type: SignalType;
    payload?: ISignalPayload;
}

export const SignalType = {
    BasicShipAttack: "BasicShipAttack",
    ReceiveShipAttack: "ReceiveShipAttack",
} as const;

export type SignalType = (typeof SignalType)[keyof typeof SignalType];

export interface ISignalPayload {
    senderId: string;
}

export interface IShipAttackSignalPayload extends ISignalPayload {
    attackLocations: ICellLoc[];
}
export interface IShipReceiveAttackSignalPayload extends ISignalPayload {
    attacks: IAttackPayload[];    
}

export interface IAttackPayload {
    shipId: string;
    hullId: string;
    attackDamage: number;
    onHit?: (attackedShip: Ship) => void;
}
