import {
    IEffectDetonatedEvent,
    IHull,
    IPlainGameState,
    IShipDestroyedEvent,
    IShipMovedEvent,
    ITurnEvent,
    TurnEventKind,
    isShipMovedEvent,
} from "@shared/types";
import clone from "lodash.clonedeep";

const upsertById = <T extends { id: string }>(list: T[], item: T): void => {
    const index = list.findIndex((existing) => existing.id === item.id);
    if (index === -1) {
        list.push(item);
        return;
    }
    list[index] = item;
};

/**
 * Advances the transient playback state event-by-event so a full board render
 * after each event shows its post-event arrangement. Entity data comes from
 * the final resolved state (the only complete source the viewer has); only
 * positions are rewound from the events. Never touches the DOM — the
 * PlaybackRunner renders, this class only patches plain data.
 */
export class PlaybackStateApplier {
    constructor(
        private readonly finalState: IPlainGameState,
        private readonly events: ITurnEvent[],
    ) {}

    /**
     * Spawn the event's ship into the playback state when it is missing — a
     * ship hidden at round start enters the viewer's vision at its first
     * visible event. Returns true when something was spawned so the runner
     * re-renders before animating (the animation needs the sprite in the DOM).
     * Deploys are excluded: their `apply` IS the appearance.
     */
    public ensurePresence(playback: IPlainGameState, index: number): boolean {
        const event = this.events[index];
        switch (event.kind) {
            case TurnEventKind.ShipMoved:
            case TurnEventKind.HullDamaged:
            case TurnEventKind.ShipDestroyed:
                return this.spawnShipIfMissing(playback, event.shipId, event.playerId, index);
            default:
                return false;
        }
    }

    public apply(playback: IPlainGameState, index: number): void {
        const event = this.events[index];
        switch (event.kind) {
            case TurnEventKind.ShipDeployed:
                this.spawnShipIfMissing(playback, event.shipId, event.playerId, index);
                return;
            case TurnEventKind.ShipMoved:
                this.applyMove(playback, event);
                return;
            case TurnEventKind.ShipDestroyed:
                this.applyDestruction(playback, event);
                return;
            case TurnEventKind.EffectDetonated:
                this.applyDetonation(playback, event);
                return;
            case TurnEventKind.HullDamaged:
            case TurnEventKind.CardPlayed:
                // No board-arrangement change: the hit is a flash on an
                // existing sprite; hand changes aren't animated (v1).
                return;
        }
    }

    private spawnShipIfMissing(playback: IPlainGameState, shipId: string, playerId: string, index: number): boolean {
        const existing = playback.ships.find((ship) => ship.id === shipId);
        if (existing?.deployed && !existing.destroyed) return false;

        const finalShip = this.finalState.ships.find((ship) => ship.id === shipId);
        if (!finalShip) return false;

        upsertById(playback.ships, { ...clone(finalShip), deployed: true, destroyed: false });

        const hulls = playback.hulls ?? [];
        playback.hulls = hulls;
        (this.finalState.hulls ?? [])
            .filter((hull) => hull.shipId === shipId)
            .forEach((hull) => upsertById(hulls, this.hullAtPreEventPosition(hull, shipId, index)));

        const player = playback.players.find((p) => p.id === playerId);
        if (player && !player.ships.includes(shipId)) {
            player.ships.push(shipId);
        }
        return true;
    }

    /** The final state has the hull's *end-of-turn* position; the pre-event
     *  position is the `from` of the ship's next visible move (which for a
     *  deploy is the deploy spot, and for a move is that move's own start).
     *  No later move → the hull never moved after this event; final is exact. */
    private hullAtPreEventPosition(finalHull: IHull, shipId: string, index: number): IHull {
        const hull = clone(finalHull);
        const nextMove = this.events
            .slice(index)
            .filter(isShipMovedEvent)
            .find((event) => event.shipId === shipId);
        const segment = nextMove?.hulls.find((s) => s.hullId === finalHull.id);
        if (!segment) return hull;

        hull.location = segment.from;
        hull.orientation = nextMove.startingOrientation;
        return hull;
    }

    private applyMove(playback: IPlainGameState, event: IShipMovedEvent): void {
        const finalHullById = new Map((this.finalState.hulls ?? []).map((hull) => [hull.id, hull]));
        event.hulls.forEach((segment) => {
            const hull = (playback.hulls ?? []).find((h) => h.id === segment.hullId);
            if (!hull) return;
            hull.location = segment.to ?? segment.from;
            // The event doesn't carry the post-move orientation; the final
            // state's is exact unless the ship moves again this turn (a later
            // move event re-patches, so it self-corrects).
            const finalHull = finalHullById.get(segment.hullId);
            if (finalHull) {
                hull.orientation = finalHull.orientation;
            }
        });
    }

    private applyDestruction(playback: IPlainGameState, event: IShipDestroyedEvent): void {
        const ship = playback.ships.find((s) => s.id === event.shipId);
        if (!ship) return;
        ship.destroyed = true;
    }

    private applyDetonation(playback: IPlainGameState, event: IEffectDetonatedEvent): void {
        playback.effects = playback.effects.filter((effect) => effect.id !== event.effectId);
    }
}
