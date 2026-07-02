import {
    IBasicShipAttackSignalHandleCtx,
    IBasicShipDeploySignalHandleCtx,
    IBasicShipMoveSignalHandleCtx,
    ICellLoc,
    IGameState,
    IGameStateManager,
    IGetValidAttackCellsQueryCtx,
    IGetValidDeployCellsQueryCtx,
    IGetValidMoveCellsQueryCtx,
    IGetValidMoveRoutesQueryCtx,
    IHull,
    IPlainShip,
    IReceiveEffectAttackLocationSignalHandleCtx,
    IReceiveShipAttackSignalHandleCtx,
    IShip,
} from "@shared/types";
import { LocationHelper } from "@shared/utils";
import { boardToPathCellNodes } from "@shared/utils/cell-node-helper";
import { cellLocToNodeId, nodeIdToCellLoc, PathFinder, routeToCellLocs } from "@shared/utils/path-finder";
import { computeDeployedHullLocation, HullCalculator } from "@shared/utils/hull-helper";
import { getHull, locationToKey } from "@shared/utils/helpers";
import { SegmentBuilder } from "@shared/utils/segment-builder";
import { EFFECT_REF_NO } from "@shared/config/constants";
import { mergician } from "mergician";
import { Attack } from "./Attack";
import { ArmorPiercingRoundsEffect } from "./effects/ArmorPiercingRoundsEffect";
import { ShipEntity } from "./entities/ShipEntity";
import { Movement } from "./Movement";
import { Resolver } from "./resolvers/Resolver";
import { GameCreateHullSignal } from "./signals/GameCreateHullSignal";
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
        const visible = new Set<string>();
        this.hulls.forEach((hull) => {
            if (!hull.location) return;
            visible.add(locationToKey(hull.location));
            PathFinder.getCellsWithinRange({ start: hull.location, range: hull.visionRange }).forEach((cell) =>
                visible.add(locationToKey(cell)),
            );
        });
        return visible;
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
    // query functions (read-only — lifted from the legacy GameEngine.prime.*)
    // ===============================================================================

    getValidMoveCells(ctx: IGetValidMoveCellsQueryCtx) {
        const { gsm, resolve } = ctx;

        const currentLoc = this.getFrontHull().location;
        const movementRange = this.remainingMovement || 0;

        const pathFinder = this.buildMoveShipPathFinder(gsm);
        const startNode = pathFinder.getNode(cellLocToNodeId(currentLoc));

        const validCells = pathFinder
            .getReachableCells({
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: movementRange }),
            })
            .map(nodeIdToCellLoc);

        resolve({ validCells, origin: currentLoc });
    }

    getValidMoveRoutes(ctx: IGetValidMoveRoutesQueryCtx) {
        const { gsm, resolve } = ctx;
        const { destinationTileId } = ctx.signal.payload;

        if (!this.hulls?.[0]) return resolve({ routes: [] });

        const currentLoc = this.getFrontHull().location;
        const movementRange = this.remainingMovement || 0;

        const pathFinder = this.buildMoveShipPathFinder(gsm);
        const startNode = pathFinder.getNode(cellLocToNodeId(currentLoc));

        const routes = pathFinder.getPathToNode(
            {
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: movementRange }),
            },
            destinationTileId,
        );

        resolve({ routes: routes.map(routeToCellLocs) });
    }

    getValidAttackCells(ctx: IGetValidAttackCellsQueryCtx) {
        const { gsm, resolve } = ctx;
        const { playerId } = ctx.signal.payload;

        // Block targeting only on tiles occupied by the player's own *live* hulls.
        // Destroyed hulls leave the tile effectively empty — they shouldn't block
        // the attacker from targeting through their wreck.
        const ownShipIds = gsm.getPlayer(playerId).ships?.map((s) => s.id) ?? [];
        const locArr = gsm.gameState.hulls
            .filter((h) => !h.destroyed && ownShipIds.includes(h.shipId))
            .map((h) => locationToKey(h.location));

        const currentLoc = this.hulls?.find((h) => h.shipId === this.id && h.front)?.location ?? [0, 0];
        const attackRange = this.attackRange || 0;

        const validCells = PathFinder.getCellsWithinRange({
            start: currentLoc,
            range: attackRange,
            minRange: this.attackMinRange,
            filterFn: (loc: ICellLoc) => !locArr.includes(locationToKey(loc)),
        });

        resolve({ validCells, origin: currentLoc });
    }

    getValidDeployCells(ctx: IGetValidDeployCellsQueryCtx) {
        const { gsm, resolve } = ctx;
        const { playerId } = ctx.signal.payload;

        const availableCells: ICellLoc[] = [];
        const { rows, cols } = gsm.getBoardDimensions();
        const isFirstPlayer = gsm.gameState.getFirstPlayerId() === playerId;

        for (let i = 0; i < cols; i++) {
            availableCells.push([i, isFirstPlayer ? 0 : rows - 1]);
        }

        const validCells = new HullCalculator(gsm, isFirstPlayer).getValidDeploymentLocations(
            availableCells,
            this.hullTemplates.map((ht) => ht.templateLocation),
        );

        resolve({ validCells });
    }

    private buildMoveShipPathFinder(gsm: IGameStateManager): PathFinder {
        // FIXME: we should only take into account 'visible' ships
        const locationHelper = new LocationHelper(gsm.getPlayers());

        const pathFinder = new PathFinder();
        pathFinder.initialiseNodes(
            (loc: ICellLoc) => !locationHelper.isLocationOccupied(loc),
            boardToPathCellNodes(gsm.gameState.board),
        );
        return pathFinder;
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

            const armorPiercingEffects = this.getArmorPiercingEffects(gsm);

            Object.entries(shipsHit).forEach(([attackedShipId, hullIds]) => {
                const attacks = hullIds.map(
                    (hullId) =>
                        new Attack({
                            originId: this.id,
                            targetId: hullId,
                            damage: this.attackDamage,
                            isIgnoreArmor: armorPiercingEffects.length > 0,
                        }),
                );
                emitter([
                    new ReceiveShipAttackSignal({
                        targetId: attackedShipId,
                        senderId: this.id,
                        originId: signal.id,
                        payload: { attackingShipId: this.id, attackedShipId, attacks },
                    }),
                ]);
            });

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    // Armor-piercing buffs attached to this ship (innate, e.g. tudf_destroyer0).
    private getArmorPiercingEffects(gsm: IGameStateManager): ArmorPiercingRoundsEffect[] {
        return gsm
            .getEffects({ effectRefNos: [EFFECT_REF_NO.armorPiercingRounds] })
            .filter((effect): effect is ArmorPiercingRoundsEffect => effect instanceof ArmorPiercingRoundsEffect)
            .filter((effect) => effect.appliesToAttacker(this.id));
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
                    new GameCreateHullSignal({
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hull, shipId: this.id },
                    }),
                ]);
            });
            this.onDeploy(ctx);
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

    protected onDeploy(ctx: IBasicShipDeploySignalHandleCtx) {
        // overriden
        return;
    }

    move(ctx: IBasicShipMoveSignalHandleCtx) {
        // called upon receiving BasicShipMove signal
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { targetCell, route } = signal.payload;

            this.remainingMovement = 0;

            this.getNewHullLocations(targetCell, route).forEach((newHull) => {
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

            attacks.forEach((attack) => {
                emitter([
                    new HullReceiveAttackSignal({
                        targetId: attack.targetId,
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hullId: attack.targetId, attack },
                    }),
                ]);
            });

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    receiveEffectAttack(ctx: IReceiveEffectAttackLocationSignalHandleCtx) {
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { attack } = signal.payload;

            emitter([
                new HullReceiveAttackSignal({
                    targetId: attack.targetId,
                    senderId: this.id,
                    originId: signal.id,
                    payload: { hullId: attack.targetId, attack },
                }),
            ]);

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
