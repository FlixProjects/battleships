export interface ISignal {
    id: string;
    type: SignalType;
}

export const SignalType = {
    BasicShipAttack: "BasicShipAttack",
} as const;

export type SignalType = (typeof SignalType)[keyof typeof SignalType];
