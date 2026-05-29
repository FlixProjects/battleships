import {
    IBasicShipAttackSignalHandleCtx,
    ICellLoc,
    IGameState,
    IHull,
    IPlainShip,
    IReceiveShipAttackSignalHandleCtx,
    IShip,
} from "@shared/types";
import { PathHelper } from "@shared/utils";
import { SegmentBuilder } from "@shared/utils/segment-builder";
import { mergician } from "mergician";
import { ShipEntity } from "./entities/ShipEntity";
import { Resolver } from "./resolvers/Resolver";
import { ReceiveShipAttackSignal } from "./signals/ReceiveShipAttackSignal";

export class Ship extends ShipEntity {
    constructor(props: Readonly<IShip>) {
        super(props);
    }

    getVisibleTiles() {
        if (this.destroyed || !this.deployed || !this.hulls) {
            return new Set<string>();
        }
        const ph = new PathHelper();
        return ph.getVisibleTilesForPlayer(this.hulls);
    }

    updateVisibility(visibleTiles: Set<string>) {
        this.hulls?.forEach((h) => {
            h.updateVisibility(visibleTiles);
        });

        this.isVisible = !!this.hulls?.some((h) => h.isVisible);

        this.removeInvisibleHullLocations();
        return this;
    }

    removeInvisibleHullLocations() {
        this.hulls = this.hulls?.filter((h) => h.isVisible);
        return this;
    }

    resolveDestroyed() {
        if (!this.hulls || this.hulls.length === 0 || !this.deployed || this.destroyed) return this;

        // non-zero no. of hulls
        if (this.hulls.every((h) => h.destroyed)) {
            this.destroyed = true;
        }
        return this;
    }

    resolveAttack() {
        this.remainingAttacks -= 1;
        return this;
    }

    getFrontHull() {
        if (!this.hulls || this.hulls.length === 0) {
            throw new Error("[Error] Trying to get front hull when there are no hulls!");
        }
        return this.hulls?.find((h) => h.front) ?? this.hulls?.[0];
    }

    getNewHullLocations(endCell: ICellLoc, route?: ICellLoc[]) {
        const segmentBuilder = new SegmentBuilder();
        const startingOrientation = this.getFrontHull().orientation;
        const oldFrontLocation = this.getFrontHull().location;

        const { finalOrientation, backLocation } = this.computeRouteOutcome({
            segmentBuilder,
            startingOrientation,
            oldFrontLocation,
            endCell,
            route,
        });

        const newHulls = this.hulls?.map((h) => mergician({}, h)) as IHull[];

        // TODO: to inject movement behaviour calculator
        // TODO: barely serviceable implementation for 2-tile ships
        newHulls.forEach((h) => {
            h.location = h.front ? endCell : backLocation;
            h.orientation = finalOrientation;
        });

        return newHulls;
    }

    private computeRouteOutcome(args: {
        segmentBuilder: SegmentBuilder;
        startingOrientation: number;
        oldFrontLocation: ICellLoc;
        endCell: ICellLoc;
        route?: ICellLoc[];
    }): { finalOrientation: number; backLocation: ICellLoc } {
        const { segmentBuilder, startingOrientation, oldFrontLocation, endCell, route } = args;

        if (route && route.length >= 2) {
            let orientation = startingOrientation;
            for (let i = 1; i < route.length; i++) {
                orientation += segmentBuilder.rotationToFace(route[i - 1], route[i], orientation);
            }
            return { finalOrientation: orientation, backLocation: route[route.length - 2] };
        }

        const segments = segmentBuilder.buildSegments(oldFrontLocation, endCell, startingOrientation);
        const finalOrientation = segments.reduce((sum, curr) => sum + curr.rotateDegrees, startingOrientation);
        return { finalOrientation, backLocation: oldFrontLocation };
    }

    // ===============================================================================
    // signal functions
    // ===============================================================================

    attack(ctx: IBasicShipAttackSignalHandleCtx) {
        // called upon receiving BasicShipAttack signal
        const { gsm, signal, emitter, saveAction } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            this.resolveAttack();
            const { payload, senderId } = signal;
            const { attackLocations } = payload;

            // update CP
            const player = gsm.getPlayer(this.playerId);
            player.commandPoints -= this.attackCommandPointCost;
            gsm.updatePlayer(player);

            // save action
            saveAction();

            const shipsHit: Record<string, string[]> = {};

            gsm.getHulls(attackLocations).forEach((hull) => {
                shipsHit[hull.shipId] = shipsHit[hull.shipId] || [];
                shipsHit[hull.shipId].push(hull.id);
            });

            Object.entries(shipsHit).forEach(([attackedShipId, hullIds]) => {
                const attackDamage = this.attackDamage;
                emitter(
                    [
                        new ReceiveShipAttackSignal(attackedShipId, {
                            attackingShipId: this.id,
                            attackedShipId,
                            attacks: hullIds.map((hullId) => ({
                                shipId: attackedShipId,
                                hullId,
                                attackDamage,
                            })),
                        }),
                    ],
                    senderId,
                );
            });

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    receiveAttack(ctx: IReceiveShipAttackSignalHandleCtx) {
        const { gsm } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { signal } = ctx;
            const { payload } = signal;
            const { attacks } = payload;

            attacks.forEach(({ hullId, attackDamage }) => {
                const hull = this.getHull(hullId);
                if (hull) {
                    hull.getDamaged(attackDamage);
                }
            });

            this.resolveDestroyed();

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    // ===============================================================================
    // transform functions
    // ===============================================================================

    /** Flattens hulls (IHull[]) → string[] of hull IDs. */
    public toPlain(): IPlainShip {
        return {
            ...this,
            hulls: this.hulls?.map((h) => h.id) ?? [],
        };
    }

    /**
     * Caller must hydrate hulls before ships.
     */
    public static toDomain(plain: IPlainShip, state: IGameState): Ship {
        const hullsById = new Map<string, IHull>((state.hulls ?? []).map((h) => [h.id, h]));
        const hulls = plain.hulls.map((id) => hullsById.get(id)).filter((h): h is IHull => h !== undefined);
        return new Ship({ ...plain, hulls });
    }
}
