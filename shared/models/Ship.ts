import {
    IBasicShipAttackSignalHandleCtx,
    IBasicShipDeploySignalHandleCtx,
    IBasicShipMoveSignalHandleCtx,
    ICellLoc,
    IGameState,
    IHull,
    IPlainShip,
    IReceiveShipAttackSignalHandleCtx,
    IShip,
} from "@shared/types";
import { PathHelper } from "@shared/utils";
import { computeDeployedHullLocation } from "@shared/utils/hull-helper";
import { getHull } from "@shared/utils/helpers";
import { SegmentBuilder } from "@shared/utils/segment-builder";
import { mergician } from "mergician";
import { ShipEntity } from "./entities/ShipEntity";
import { Resolver } from "./resolvers/Resolver";
import { GameStateCreateHullSignal } from "./signals/GameStateCreateHullSignal";
import { HullMoveSignal } from "./signals/HullMoveSignal";
import { HullReceiveAttackSignal } from "./signals/HullReceiveAttackSignal";
import { PlayerSpendCommandPointsSignal } from "./signals/PlayerSpendCommandPointsSignal";
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

    reduceAttacksRemaining() {
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

    getDeployHullLocations(anchorCell: ICellLoc, isFirstPlayer: boolean): IHull[] {
        return this.hullTemplates.map((ht) => {
            const location = computeDeployedHullLocation(anchorCell, ht.templateLocation, isFirstPlayer);
            return getHull({ shipId: this.id, hullTemplate: ht, location, isFirstPlayer });
        });
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
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            this.reduceAttacksRemaining();
            const { payload } = signal;
            const { attackLocations } = payload;

            emitter([
                new PlayerSpendCommandPointsSignal({
                    targetId: this.playerId,
                    senderId: this.id,
                    originId: signal.id,
                    payload: { playerId: this.playerId, amount: this.attackCommandPointCost },
                }),
            ]);

            const shipsHit: Record<string, string[]> = {};

            gsm.getHulls(attackLocations).forEach((hull) => {
                shipsHit[hull.shipId] = shipsHit[hull.shipId] || [];
                shipsHit[hull.shipId].push(hull.id);
            });

            Object.entries(shipsHit).forEach(([attackedShipId, hullIds]) => {
                const attackDamage = this.attackDamage;
                const payload = {
                    attackingShipId: this.id,
                    attackedShipId,
                    attacks: hullIds.map((hullId) => ({
                        shipId: attackedShipId,
                        hullId,
                        attackDamage,
                    })),
                };
                emitter([
                    new ReceiveShipAttackSignal({
                        targetId: attackedShipId,
                        payload,
                        senderId: this.id,
                        originId: signal.id,
                    }),
                ]);
            });

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    deploy(ctx: IBasicShipDeploySignalHandleCtx) {
        // called upon receiving BasicShipDeploy signal
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { location } = signal.payload;

            this.deployed = true;

            const isFirstPlayer = gsm.gameState.isFirstPlayer(this.playerId);
            this.getDeployHullLocations(location, isFirstPlayer).forEach((hull) => {
                emitter([
                    new GameStateCreateHullSignal({
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hull, shipId: this.id },
                    }),
                ]);
            });

            emitter([
                new PlayerSpendCommandPointsSignal({
                    targetId: this.playerId,
                    senderId: this.id,
                    originId: signal.id,
                    payload: { playerId: this.playerId, amount: this.commandPointCost },
                }),
            ]);

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    move(ctx: IBasicShipMoveSignalHandleCtx) {
        // called upon receiving BasicShipMove signal
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { hullLocations } = signal.payload;

            this.remainingMovement = 0;

            hullLocations.forEach((newHull) => {
                emitter([
                    new HullMoveSignal({
                        targetId: newHull.id,
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hullId: newHull.id, location: newHull.location, orientation: newHull.orientation },
                    }),
                ]);
            });

            emitter([
                new PlayerSpendCommandPointsSignal({
                    targetId: this.playerId,
                    senderId: this.id,
                    originId: signal.id,
                    payload: { playerId: this.playerId, amount: this.movementCommandPointCost },
                }),
            ]);

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    receiveAttack(ctx: IReceiveShipAttackSignalHandleCtx) {
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { attacks } = signal.payload;

            attacks.forEach(({ hullId, attackDamage }) => {
                emitter([
                    new HullReceiveAttackSignal({
                        targetId: hullId,
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hullId, attackDamage },
                    }),
                ]);
            });

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
