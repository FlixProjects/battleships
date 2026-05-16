import { ICellLoc, IHull, TEffectRefNo } from "./types";

/**
 * Presentation-oriented description of *what happened* during turn
 * resolution, distinct from the engine's low-level commit `IResult`
 * payloads. The uniform pipeline accumulates these into
 * `ActionResolver.results`; the injected event consumer (`toCommands`)
 * maps them to `FE*` commands. Every shape here must stay JSON-serializable
 * — it crosses the wire from Lambda to the client.
 */
export const TurnEventKind = {
    ShipDeployed: "ShipDeployed",
    ShipMoved: "ShipMoved",
    HullsDamaged: "HullsDamaged",
    ShipDestroyed: "ShipDestroyed",
    EffectApplied: "EffectApplied",
    CardPlayed: "CardPlayed",
} as const;

export type TTurnEventKind = (typeof TurnEventKind)[keyof typeof TurnEventKind];

interface ITurnEventBase {
    kind: TTurnEventKind;
    playerId: string;
}

export interface IShipDeployedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipDeployed;
    shipId: string;
    hulls: IHull[];
}

/** Serializable per-hull move (the FE translator rebuilds the animation Map). */
export interface IHullMoved {
    hullId: string;
    from: ICellLoc;
    to: ICellLoc;
}

export interface IShipMovedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipMoved;
    shipId: string;
    hulls: IHullMoved[];
    route?: ICellLoc[];
}

export interface IHullsDamagedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.HullsDamaged;
    /** shipId → ids of that ship's hulls that were hit. */
    shipsHit: Record<string, string[]>;
}

export interface IShipDestroyedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipDestroyed;
    shipId: string;
}

export interface IEffectAppliedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.EffectApplied;
    effectId: string;
    refNo: TEffectRefNo;
}

export interface ICardPlayedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.CardPlayed;
    cardId: string;
}

export type ITurnEvent =
    | IShipDeployedEvent
    | IShipMovedEvent
    | IHullsDamagedEvent
    | IShipDestroyedEvent
    | IEffectAppliedEvent
    | ICardPlayedEvent;

export const isShipDeployedEvent = (e: ITurnEvent): e is IShipDeployedEvent =>
    e.kind === TurnEventKind.ShipDeployed;
export const isShipMovedEvent = (e: ITurnEvent): e is IShipMovedEvent => e.kind === TurnEventKind.ShipMoved;
export const isHullsDamagedEvent = (e: ITurnEvent): e is IHullsDamagedEvent =>
    e.kind === TurnEventKind.HullsDamaged;
export const isShipDestroyedEvent = (e: ITurnEvent): e is IShipDestroyedEvent =>
    e.kind === TurnEventKind.ShipDestroyed;
export const isEffectAppliedEvent = (e: ITurnEvent): e is IEffectAppliedEvent =>
    e.kind === TurnEventKind.EffectApplied;
export const isCardPlayedEvent = (e: ITurnEvent): e is ICardPlayedEvent => e.kind === TurnEventKind.CardPlayed;
