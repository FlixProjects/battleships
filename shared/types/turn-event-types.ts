import { ICellLoc, TEffectRefNo } from "./types";

/**
 * Presentation-oriented description of *what happened* during the
 * authoritative turn resolution. The `TurnEventRecorder` projects the signal
 * cascade into these; `GameState.lastTurnEvents` carries them across the wire;
 * the FE translator maps them to `FE*` animation commands for the
 * rewind-and-replay playback. Every shape must stay JSON-serializable.
 */
export const TurnEventKind = {
    ShipDeployed: "ShipDeployed",
    ShipMoved: "ShipMoved",
    HullDamaged: "HullDamaged",
    ShipDestroyed: "ShipDestroyed",
    EffectDetonated: "EffectDetonated",
    CardPlayed: "CardPlayed",
} as const;

export type TTurnEventKind = (typeof TurnEventKind)[keyof typeof TurnEventKind];

interface ITurnEventBase {
    kind: TTurnEventKind;
    /** Player whose action/effect caused the event — always sees it in playback. */
    playerId: string;
    /** Viewers allowed to see this event, stamped from visibility *at event time*
     *  (not final-state visibility). `obscureOtherPlayer` prunes by this. */
    visibleToPlayerIds: string[];
}

export interface IShipDeployedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipDeployed;
    shipId: string;
    /** Deploy anchor tile. */
    location: ICellLoc;
}

/** Serializable per-hull move (the FE translator rebuilds the animation Map).
 *  `to` is filled in by the cascade's `HullMove` signals after the initiating
 *  `BasicShipMove` captured `from`. */
export interface IHullMovedSegment {
    hullId: string;
    from: ICellLoc;
    to?: ICellLoc;
}

export interface IShipMovedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipMoved;
    shipId: string;
    startingOrientation: number;
    hulls: IHullMovedSegment[];
    route?: ICellLoc[];
    /** For viewers who see only part of the move: their truncated route segment,
     *  stamped from visibility at event time. `obscureOtherPlayer` collapses this
     *  into `route` for the viewer and strips the map. */
    visibleRouteByPlayer?: Record<string, ICellLoc[]>;
}

export interface IHullDamagedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.HullDamaged;
    shipId: string;
    hullId: string;
    location: ICellLoc;
}

export interface IShipDestroyedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.ShipDestroyed;
    shipId: string;
    hullIds: string[];
    /** The destroyed hulls' tiles (visibility check + animation targets). */
    locations: ICellLoc[];
}

export interface IEffectDetonatedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.EffectDetonated;
    effectId: string;
    refNo: TEffectRefNo;
    location: ICellLoc;
}

export interface ICardPlayedEvent extends ITurnEventBase {
    kind: typeof TurnEventKind.CardPlayed;
    cardId: string;
    cardName: string;
}

export type ITurnEvent =
    | IShipDeployedEvent
    | IShipMovedEvent
    | IHullDamagedEvent
    | IShipDestroyedEvent
    | IEffectDetonatedEvent
    | ICardPlayedEvent;

export const isShipDeployedEvent = (e: ITurnEvent): e is IShipDeployedEvent =>
    e.kind === TurnEventKind.ShipDeployed;
export const isShipMovedEvent = (e: ITurnEvent): e is IShipMovedEvent => e.kind === TurnEventKind.ShipMoved;
export const isHullDamagedEvent = (e: ITurnEvent): e is IHullDamagedEvent =>
    e.kind === TurnEventKind.HullDamaged;
export const isShipDestroyedEvent = (e: ITurnEvent): e is IShipDestroyedEvent =>
    e.kind === TurnEventKind.ShipDestroyed;
export const isEffectDetonatedEvent = (e: ITurnEvent): e is IEffectDetonatedEvent =>
    e.kind === TurnEventKind.EffectDetonated;
export const isCardPlayedEvent = (e: ITurnEvent): e is ICardPlayedEvent => e.kind === TurnEventKind.CardPlayed;
