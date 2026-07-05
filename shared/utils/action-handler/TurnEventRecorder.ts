import { SignalType } from "../../models/signals/types";
import {
    IBasicShipAttackSignalHandleCtx,
    IBasicShipDeploySignalHandleCtx,
    IBasicShipMoveSignalHandleCtx,
    ICellLoc,
    IEffectAttackLocationSignalHandleCtx,
    IHullDestroyedSignalHandleCtx,
    IHullMoveSignalHandleCtx,
    IHullReceiveDamageSignalHandleCtx,
    IPlayCardSignalHandleCtx,
    IShipMovedEvent,
    ISignalHandleCtx,
    ITurnEvent,
    TurnEventKind,
    isShipDestroyedEvent,
    isShipMovedEvent,
} from "../../types";
import { locationToKey } from "../helpers";

export type TVisibleTilesByPlayer = Record<string, Set<string>>;

/**
 * Projects the authoritative resolve's signal cascade into presentation
 * `ITurnEvent`s. Attached to `GameEngine` as its signal observer, so it sees
 * every drained signal once, in resolution order, with pre-mutation state —
 * which is what lets it capture "from" locations and enrich from `gsm`
 * without any entity/handler knowing it exists.
 *
 * `stampVisibility` is called by `ActionResolver` after each resolve step with
 * both players' visible tiles *at that moment*, so mid-turn vision changes are
 * captured per event (not final-state visibility).
 */
export class TurnEventRecorder {
    private events: ITurnEvent[] = [];
    private stampedCount = 0;

    /** GameEngine signal observer (arrow fn so it can be passed unbound). */
    public observe = (ctx: ISignalHandleCtx): void => {
        switch (ctx.signal.type) {
            case SignalType.BasicShipDeploy:
                return this.recordShipDeployed(ctx as IBasicShipDeploySignalHandleCtx);
            case SignalType.BasicShipMove:
                return this.recordShipMoved(ctx as IBasicShipMoveSignalHandleCtx);
            case SignalType.BasicShipAttack:
                return this.recordShipAttacked(ctx as IBasicShipAttackSignalHandleCtx);
            case SignalType.HullMove:
                return this.fillHullDestination(ctx as IHullMoveSignalHandleCtx);
            case SignalType.HullReceiveDamage:
                return this.recordHullDamaged(ctx as IHullReceiveDamageSignalHandleCtx);
            case SignalType.HullDestroyed:
                return this.recordShipDestroyedIfLastHull(ctx as IHullDestroyedSignalHandleCtx);
            case SignalType.PlayCard:
                return this.recordCardPlayed(ctx as IPlayCardSignalHandleCtx);
            case SignalType.EffectAttackLocation:
                return this.recordEffectDetonated(ctx as IEffectAttackLocationSignalHandleCtx);
        }
    };

    public collect(): ITurnEvent[] {
        return [...this.events];
    }

    /**
     * Stamp every event recorded since the previous stamp with the players who
     * could see it at this moment. The owning player always sees their event;
     * partially-visible moves additionally get a per-viewer truncated route.
     */
    public stampVisibility(visibleTilesByPlayer: TVisibleTilesByPlayer): void {
        this.events.slice(this.stampedCount).forEach((event) => this.stamp(event, visibleTilesByPlayer));
        this.stampedCount = this.events.length;
    }

    private stamp(event: ITurnEvent, visibleTilesByPlayer: TVisibleTilesByPlayer): void {
        const locations = this.eventLocations(event);
        event.visibleToPlayerIds = Object.entries(visibleTilesByPlayer)
            .filter(([playerId, tiles]) => playerId === event.playerId || this.seesAny(tiles, locations))
            .map(([playerId]) => playerId);

        if (isShipMovedEvent(event)) {
            this.stampVisibleRouteSegments(event, visibleTilesByPlayer);
        }
    }

    private recordShipDeployed(ctx: IBasicShipDeploySignalHandleCtx): void {
        const { shipId, location } = ctx.signal.payload;
        this.events.push({
            kind: TurnEventKind.ShipDeployed,
            playerId: ctx.gsm.getShip(shipId).playerId,
            visibleToPlayerIds: [],
            shipId,
            location,
        });
    }

    private recordShipMoved(ctx: IBasicShipMoveSignalHandleCtx): void {
        const { shipId, route } = ctx.signal.payload;
        const ship = ctx.gsm.getShip(shipId);
        this.events.push({
            kind: TurnEventKind.ShipMoved,
            playerId: ship.playerId,
            visibleToPlayerIds: [],
            shipId,
            startingOrientation: ship.getFrontHull().orientation,
            // Pre-mutation state: these are the hulls' *departure* tiles. The
            // cascade's HullMove signals fill each segment's `to`.
            hulls: ctx.gsm.getShipHulls(shipId).map((hull) => ({ hullId: hull.id, from: hull.location })),
            route,
        });
    }

    private fillHullDestination(ctx: IHullMoveSignalHandleCtx): void {
        const { hullId, location } = ctx.signal.payload;
        const segment = this.findPendingMoveSegment(hullId);
        if (!segment) return;
        segment.to = location;
    }

    private findPendingMoveSegment(hullId: string): IShipMovedEvent["hulls"][number] | undefined {
        for (let i = this.events.length - 1; i >= 0; i--) {
            const event = this.events[i];
            if (!isShipMovedEvent(event)) continue;
            const segment = event.hulls.find((hull) => hull.hullId === hullId && hull.to === undefined);
            if (segment) return segment;
        }
        return undefined;
    }

    private recordShipAttacked(ctx: IBasicShipAttackSignalHandleCtx): void {
        const { attackingShipId, attackLocations } = ctx.signal.payload;
        const ship = ctx.gsm.getShip(attackingShipId);
        this.events.push({
            kind: TurnEventKind.ShipAttacked,
            playerId: ship.playerId,
            visibleToPlayerIds: [],
            shipId: attackingShipId,
            origin: ship.getFrontHull().location,
            targetLocations: attackLocations,
        });
    }

    private recordHullDamaged(ctx: IHullReceiveDamageSignalHandleCtx): void {
        const { hullId } = ctx.signal.payload;
        const hull = ctx.gsm.getHull(hullId);
        this.events.push({
            kind: TurnEventKind.HullDamaged,
            // The hull's owner, not the attacker: damage to your ship is always
            // yours to see, whoever caused it.
            playerId: ctx.gsm.getShip(hull.shipId).playerId,
            visibleToPlayerIds: [],
            shipId: hull.shipId,
            hullId,
            location: hull.location,
        });
    }

    private recordShipDestroyedIfLastHull(ctx: IHullDestroyedSignalHandleCtx): void {
        const { shipId } = ctx.signal.payload;
        if (this.events.some((event) => isShipDestroyedEvent(event) && event.shipId === shipId)) return;

        // By HullDestroyed delivery the dying hull is already flagged, so "all
        // hulls destroyed" means this signal killed the ship.
        const hulls = ctx.gsm.getShipHulls(shipId);
        if (!hulls.every((hull) => hull.destroyed)) return;

        this.events.push({
            kind: TurnEventKind.ShipDestroyed,
            playerId: ctx.gsm.getShip(shipId).playerId,
            visibleToPlayerIds: [],
            shipId,
            hullIds: hulls.map((hull) => hull.id),
            locations: hulls.map((hull) => hull.location),
        });
    }

    private recordCardPlayed(ctx: IPlayCardSignalHandleCtx): void {
        const { playerId } = ctx.signal.payload;
        const cardId = ctx.signal.targetId;
        if (!cardId) return;
        const card = ctx.gsm.gameState.cards.find((c) => c.id === cardId);
        this.events.push({
            kind: TurnEventKind.CardPlayed,
            playerId,
            visibleToPlayerIds: [],
            cardId,
            cardName: card?.name ?? cardId,
        });
    }

    private recordEffectDetonated(ctx: IEffectAttackLocationSignalHandleCtx): void {
        const { location, sourceEffectId, sourceEffectRefNo, playerId } = ctx.signal.payload;
        this.events.push({
            kind: TurnEventKind.EffectDetonated,
            playerId,
            visibleToPlayerIds: [],
            effectId: sourceEffectId,
            refNo: sourceEffectRefNo,
            location,
        });
    }

    private eventLocations(event: ITurnEvent): ICellLoc[] {
        switch (event.kind) {
            case TurnEventKind.ShipDeployed:
                return [event.location];
            case TurnEventKind.ShipMoved:
                return event.route ?? event.hulls.flatMap((h) => (h.to ? [h.from, h.to] : [h.from]));
            case TurnEventKind.ShipAttacked:
                // Only the shooter's tile: a viewer who merely sees the target
                // gets the HullDamaged flash, not a projectile that would
                // reveal where the shot came from.
                return [event.origin];
            case TurnEventKind.HullDamaged:
                return [event.location];
            case TurnEventKind.ShipDestroyed:
                return event.locations;
            case TurnEventKind.EffectDetonated:
                return [event.location];
            case TurnEventKind.CardPlayed:
                return []; // hand-private: only the owner sees it
        }
    }

    private seesAny(tiles: Set<string>, locations: ICellLoc[]): boolean {
        return locations.some((location) => tiles.has(locationToKey(location)));
    }

    private stampVisibleRouteSegments(event: IShipMovedEvent, visibleTilesByPlayer: TVisibleTilesByPlayer): void {
        const route = event.route;
        if (!route) return;

        Object.entries(visibleTilesByPlayer).forEach(([playerId, tiles]) => {
            if (playerId === event.playerId) return; // the owner sees the full route
            const segment = this.lastContiguousVisibleRun(route, tiles);
            if (segment.length === 0 || segment.length === route.length) return; // fully hidden / fully visible
            event.visibleRouteByPlayer = { ...(event.visibleRouteByPlayer ?? {}), [playerId]: segment };
        });
    }

    /** The last unbroken run of route tiles the viewer can see — the segment
     *  that connects to where the ship ended up (or last slipped from view). */
    private lastContiguousVisibleRun(route: ICellLoc[], tiles: Set<string>): ICellLoc[] {
        let run: ICellLoc[] = [];
        let lastCompleteRun: ICellLoc[] = [];
        route.forEach((cell) => {
            if (tiles.has(locationToKey(cell))) {
                run = [...run, cell];
                return;
            }
            if (run.length > 0) lastCompleteRun = run;
            run = [];
        });
        return run.length > 0 ? run : lastCompleteRun;
    }
}
