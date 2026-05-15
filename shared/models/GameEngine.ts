import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { v7 as uuidv7 } from "uuid";
import { EFFECTS_CONFIG, SUPPORTS_CONFIG } from "../config/constants";
import { BOARD_COLUMNS, BOARD_ROWS } from "../constants";
import { GameStateManager } from "../models";
import {
    EffectAnchor,
    EffectKind,
    IAttackResult,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IEffect,
    IEffectConfig,
    IErrorResult,
    IGameState,
    IGetValidAttackCellsAction,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IGetValidMoveCellsAction,
    IGetValidMoveCellsResult,
    IGetValidSupportCellsAction,
    IGetValidSupportCellsResult,
    IMoveAction,
    IMoveResult,
    IPlaySupportAction,
    IPlaySupportResult,
    IResult,
    IShipAttackAction,
    IVisionEffectPayload,
    ResultType,
    TEffectRefNo,
    THullCalculatorConstructor,
    TSupportRefNo,
} from "../types";
import { keyToLocation, LocationHelper, locationToKey, PathHelper } from "../utils";
import { createEffect } from "../utils/effect-helper";
import { cellLocToNodeId, nodeIdToCellLoc, PathFinder, routeToCellLocs } from "../utils/path-finder";
import { MoveShipValidator } from "../utils/validator";
import { Movement } from "./Movement";

// TODO: migrate to a more signal based approach
// GameEngine receives commands/signals from UI and updates the GameManager state
// updateComponents() then allows rendering of UI based on the updated state
// GameEngine should not have access to frontend methods
export class GameEngine {
    private gsm: GameStateManager;
    private pathHelper = new PathHelper();
    private HullCalculator: THullCalculatorConstructor = _HullCalculator;
    constructor(public gameState: IGameState) {
        this.gsm = new GameStateManager(gameState);
    }

    get prime() {
        return {
            deployShip: (action: IGetValidDeployCellsAction) => this.primeDeployShip(action),
            moveShip: (action: IGetValidMoveCellsAction) => this.primeMoveShip(action),
            moveShipRoutes: (action: IGetValidMoveCellsAction, destinationTileId: string) =>
                this.primeMoveShipRoutes(action, destinationTileId),
            shipAttack: (action: IGetValidAttackCellsAction) => this.primeAttack(action),
            playSupport: (action: IGetValidSupportCellsAction) => this.primePlaySupport(action),
        };
    }

    get commit() {
        return {
            deployShip: (action: IDeployAction): IDeployResult | IErrorResult => {
                const results = this.validateDeployShip(action);
                if (results.type === ResultType.SUCCESS) {
                    return this.commitDeployShip(action);
                }
                return { ...results, type: ResultType.ERROR }; // TODO: better handle typing
            },
            moveShip: (action: IMoveAction): IMoveResult | IErrorResult => {
                const results = this.validateMoveShip(action);
                if (results.type === ResultType.SUCCESS) {
                    return this.commitMoveShip(action);
                }
                return { ...results, type: ResultType.ERROR };
            },
            shipAttack: (action: IShipAttackAction): IAttackResult | IErrorResult => {
                // TODO: validate
                return this.commitAttack(action);
            },
            playSupport: (action: IPlaySupportAction): IPlaySupportResult | IErrorResult => {
                return this.commitPlaySupport(action);
            },
        };
    }

    private primeDeployShip(action: IGetValidDeployCellsAction): IGetValidDeployCellsResult {
        const { playerId, shipId } = action;

        const availableCells: ICellLoc[] = [];
        const ship = this.gsm.getShip(shipId);

        const isFirstPlayer = this.isFirstPlayer(playerId);

        for (let i = 0; i < BOARD_COLUMNS; i++) {
            availableCells.push([i, isFirstPlayer ? 0 : BOARD_ROWS - 1]);
        }

        const validCells = new this.HullCalculator(this.gsm, isFirstPlayer).getValidDeploymentLocations(
            availableCells,
            ship.hullTemplates.map((ht) => ht.templateLocation),
        );

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells,
        };
    }

    // commit should be after validation, we modify the local state.
    // Action-level concerns (pushing to pendingActions, playing the card from
    // hand, recording the action in gameState.actions) live one layer up in
    // the ActionResolver — this method only applies the deploy *effect* on
    // ships/hulls/players.
    private commitDeployShip(action: IDeployAction): IDeployResult {
        const { shipId, playerId, hullLocations } = action;

        const player = this.gsm.getPlayer(playerId);
        const shipToDeploy = this.gsm.getShip(shipId);
        const commandPointCost = shipToDeploy?.commandPointCost ? shipToDeploy.commandPointCost : 0;

        shipToDeploy.deployed = true;
        shipToDeploy.addHullLocations(hullLocations);

        player.commandPoints -= commandPointCost;

        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
            ship: shipToDeploy,
            hulls: hullLocations,
        };
    }

    public validateDeployShip(deployAction: IDeployAction): IResult {
        const { playerId, hullLocations: newHullLocations } = deployAction;
        const newState = { ...this.gameState };

        const locationHelper = new LocationHelper(newState.players);

        if (!locationHelper.hasSpaceForShip(newHullLocations.map((h) => h.location))) {
            return {
                type: ResultType.ERROR,
                playerId,
            };
        }

        return {
            type: ResultType.SUCCESS,
            playerId,
        };
    }

    private primeMoveShip(action: IGetValidMoveCellsAction): IGetValidMoveCellsResult {
        const { playerId, shipId } = action;
        const ship = this.gsm.getPlayer(playerId).getShip(shipId);

        const currentLoc = ship.getFrontHull().location;
        const movementRange = ship.remainingMovement || 0;

        const pathFinder = this.buildMoveShipPathFinder(shipId);
        const startNode = pathFinder.getNode(cellLocToNodeId(currentLoc));

        const validCells = pathFinder
            .getReachableCells({
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: movementRange }),
            })
            .map(nodeIdToCellLoc);

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells,
            origin: currentLoc,
        };
    }

    private primeMoveShipRoutes(action: IGetValidMoveCellsAction, destinationTileId: string): ICellLoc[][] {
        const { playerId, shipId } = action;
        const ship = this.gsm.getPlayer(playerId).getShip(shipId);
        if (!ship?.hulls?.[0]) return [];

        const currentLoc = ship.getFrontHull().location;
        const movementRange = ship.remainingMovement || 0;

        const pathFinder = this.buildMoveShipPathFinder(shipId);
        const startNode = pathFinder.getNode(cellLocToNodeId(currentLoc));

        const routes = pathFinder.getPathToNode(
            {
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: movementRange }),
            },
            destinationTileId,
        );

        return routes.map(routeToCellLocs);
    }

    public buildMoveShipPathFinder(_shipId: string): PathFinder {
        // FIXME: we should only take into account 'visible' ships
        const locationHelper = new LocationHelper(this.gsm.getPlayers());

        const pathFinder = new PathFinder();
        pathFinder.initialiseNodes((loc: ICellLoc) => !locationHelper.isLocationOccupied(loc));
        return pathFinder;
    }

    private commitMoveShip(action: IMoveAction): IMoveResult {
        const { hullLocations: newLocation } = action;

        const { player, ship } = this.calculateMoveShip(action);

        player.pendingActions = [...player.pendingActions, action];

        return {
            type: ResultType.SUCCESS,
            playerId: player.id,
            player,
            ship,
            hulls: newLocation,
        };
    }

    public calculateVisibility(playerId: string) {
        const obscuredState = new GameStateManager(this.gsm.gameState).gameState;
        const visibleTiles = obscuredState.getVisibleTilesforPlayer(playerId);
        return {
            obscuredGameState: obscuredState.removeInvisibleFromPlayer(visibleTiles, playerId),
            gameState: this.gsm.gameState,
        };
    }

    public calculateMoveShip(action: IMoveAction) {
        const { shipId, playerId, hullLocations: newLocation, commandPointCost } = action;
        const player = this.gsm.getPlayer(playerId);

        const ship = this.gsm.getShip(shipId);
        ship.update({ id: shipId, remainingMovement: 0 }).updateHullLocations(newLocation);

        player.updateShip(ship);
        player.update({ commandPoints: player.commandPoints - commandPointCost });

        return { player, ship };
    }

    public validateMoveShip(moveAction: IMoveAction): IResult {
        return new MoveShipValidator(this.gameState, moveAction).validate();
    }

    private primeAttack(action: IGetValidAttackCellsAction) {
        const { playerId, shipId } = action;

        const ship = this.gsm.getShip(shipId);

        // Block targeting only on tiles occupied by the player's own *live*
        // hulls. Destroyed hulls leave the tile effectively empty — they
        // shouldn't block the attacker from targeting through their wreck.
        const ownShipIds = this.gsm.getPlayer(playerId).ships?.map((s) => s.id) ?? [];
        const locArr = this.gsm.gameState.hulls
            .filter((h) => !h.destroyed && ownShipIds.includes(h.shipId))
            .map((h) => locationToKey(h.location));

        const currentLoc = ship.hulls?.find((h) => h.shipId === shipId && h.front)?.location ?? [0, 0];
        const attackRange = ship.attackRange || 0;

        const reachableCells = this.pathHelper.getReachableCells({
            start: currentLoc,
            range: attackRange,
            filterFn: (loc: ICellLoc) => !locArr.includes(locationToKey(loc)),
        });

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells: reachableCells,
            origin: currentLoc,
        };
    }

    private commitAttack(action: IShipAttackAction) {
        const { playerId } = action;

        // update for frontend
        const { players, ships, hulls } = this.calculateAttackResult(action);

        // load actions for eventual submission
        const thisPlayerIndex = players.findIndex((p) => p.id === playerId);
        players[thisPlayerIndex].pendingActions = [...players[thisPlayerIndex].pendingActions, action];

        return {
            type: ResultType.SUCCESS,
            playerId,
            players,
            ships,
            hulls,
        };
    }

    public calculateAttackResult(action: IShipAttackAction) {
        const ships = this.gsm.gameState.ships;
        const hulls = this.gsm.gameState.hulls;
        const players = this.gsm.gameState.players;

        const { attackLocations, playerId, shipId } = action;

        const playerIndex = this.getPlayerIndex(playerId);

        const attackingShip = this.gsm.gameState.getShip(shipId);

        const { attackCommandPointCost, attackDamage } = attackingShip;

        // shipId to hullIds
        const shipsHit: Record<string, string[]> = {};

        hulls.forEach((hull) => {
            if (attackLocations.some((loc) => locationToKey(loc) === locationToKey(hull.location))) {
                shipsHit[hull.shipId] = shipsHit[hull.shipId] || [];
                shipsHit[hull.shipId].push(hull.id);

                hull.getDamaged(attackDamage);
            }
        });

        ships.forEach((ship) => {
            ship.hulls = hulls.filter((h) => h.shipId === ship.id);
            ship.resolveDestroyed();
        });

        attackingShip.resolveAttack();

        players[playerIndex].commandPoints -= attackCommandPointCost;

        return {
            type: ResultType.SUCCESS,
            hulls,
            ships,
            players,
            shipsHit,
        };
    }

    private primePlaySupport(action: IGetValidSupportCellsAction): IGetValidSupportCellsResult {
        const { playerId, cardId, effectIndex } = action;
        const card = this.gsm.gameState.cards.find((c) => c.id === cardId);
        if (!card) {
            throw new Error(`primePlaySupport: card ${cardId} not found`);
        }
        const supportConfig = SUPPORTS_CONFIG[card.refNo as TSupportRefNo];
        if (!supportConfig) {
            throw new Error(`primePlaySupport: no SupportConfig for refNo '${card.refNo}'`);
        }
        const effectRefNo = supportConfig.effects[effectIndex];
        const effectConfig = effectRefNo ? EFFECTS_CONFIG[effectRefNo as TEffectRefNo] : undefined;
        if (!effectConfig) {
            throw new Error(`primePlaySupport: effectIndex ${effectIndex} out of range for ${card.refNo}`);
        }

        if (effectConfig.range === 0) {
            return { type: ResultType.SUCCESS, playerId, validCells: [], requiresTarget: false };
        }

        const validCells = this.computeAnchoredCells(playerId, effectConfig);
        return { type: ResultType.SUCCESS, playerId, validCells, requiresTarget: true };
    }

    private commitPlaySupport(action: IPlaySupportAction): IPlaySupportResult | IErrorResult {
        const { playerId, supportRefNo, cardId, targetCell, commandPointCost } = action;

        const supportConfig = SUPPORTS_CONFIG[supportRefNo as TSupportRefNo];
        if (!supportConfig) {
            return { type: ResultType.ERROR, playerId, message: `Unknown SupportCard refNo '${supportRefNo}'` };
        }

        const player = this.gsm.getPlayer(playerId);
        const effectsToAdd: IEffect[] = [];
        const currentRound = this.gsm.gameState.currentRound;

        supportConfig.effects.forEach((effectRefNo) => {
            const effectConfig = EFFECTS_CONFIG[effectRefNo as TEffectRefNo];
            if (!effectConfig) {
                throw new Error(`commitPlaySupport: no EffectConfig for refNo '${effectRefNo}'`);
            }
            const effect = this.buildEffect({
                effectConfig,
                playerId,
                cardId,
                targetCell,
                currentRound,
            });

            // resolve once on the action turn (no-op for passive vision Effects)
            effect.resolve(this.gsm);

            if (effectConfig.duration > 0) {
                this.gsm.addEffect(effect);
                effectsToAdd.push(effect);
            }
        });

        player.commandPoints -= commandPointCost;

        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
            effectsToAdd,
        };
    }

    /**
     * Manhattan-distance reachable cells from the configured anchor. For
     * `any_tile` we treat the whole board as the seed set (no anchor cell).
     */
    private computeAnchoredCells(playerId: string, effectConfig: IEffectConfig): ICellLoc[] {
        if (effectConfig.anchor === EffectAnchor.AnyTile) {
            const all: ICellLoc[] = [];
            for (let x = 0; x < BOARD_COLUMNS; x++) {
                for (let y = 0; y < BOARD_ROWS; y++) {
                    all.push([x, y]);
                }
            }
            return all;
        }

        const anchorCells = this.getAnchorCells(playerId, effectConfig.anchor);
        const pathHelper = new PathHelper();
        const reached = new Set<string>();
        anchorCells.forEach((origin) => {
            reached.add(locationToKey(origin));
            pathHelper
                .getReachableCells({ start: origin, range: effectConfig.range })
                .forEach((cell) => reached.add(locationToKey(cell)));
        });

        return Array.from(reached).map((key) => keyToLocation(key));
    }

    private getAnchorCells(playerId: string, anchor: IEffectConfig["anchor"]): ICellLoc[] {
        if (anchor === EffectAnchor.Flagship) {
            const ownShips = this.gsm.getPlayerShips(playerId);
            const flagship = ownShips.find((s) => s.isFlagship && s.deployed && !s.destroyed);
            if (!flagship) return [];
            return (flagship.hulls ?? []).map((h) => h.location);
        }
        if (anchor === EffectAnchor.AnyFriendlyHull) {
            return this.gsm.gameState.hulls
                .filter((h) => !h.destroyed)
                .filter((h) => this.gsm.gameState.ships.find((s) => s.id === h.shipId)?.playerId === playerId)
                .map((h) => h.location);
        }
        if (anchor === EffectAnchor.DeploymentRow) {
            const isFirstPlayer = this.gsm.gameState.isFirstPlayer(playerId);
            const row = isFirstPlayer ? 0 : BOARD_ROWS - 1;
            const cells: ICellLoc[] = [];
            for (let x = 0; x < BOARD_COLUMNS; x++) cells.push([x, row]);
            return cells;
        }
        return [];
    }

    private buildEffect(args: {
        effectConfig: IEffectConfig;
        playerId: string;
        cardId: string;
        targetCell?: ICellLoc;
        currentRound: number;
    }) {
        const { effectConfig, playerId, cardId, targetCell, currentRound } = args;
        const expiresAfterRound = effectConfig.duration > 0 ? currentRound + effectConfig.duration : undefined;

        const payload =
            effectConfig.kind === EffectKind.Vision
                ? this.buildVisionPayload(effectConfig, targetCell)
                : ({ kind: EffectKind.CommandPoint, amount: 0 } as const);

        const plain: IEffect = {
            id: uuidv7(),
            refNo: effectConfig.refNo,
            kind: effectConfig.kind,
            sourceCardId: cardId,
            playerId,
            createdOnRound: currentRound,
            expiresAfterRound,
            existsOnBoard: effectConfig.existsOnBoard,
            payload,
            location: targetCell,
        };
        return createEffect(plain);
    }

    private buildVisionPayload(effectConfig: IEffectConfig, targetCell?: ICellLoc): IVisionEffectPayload {
        if (!targetCell) {
            throw new Error(`Vision Effect '${effectConfig.refNo}' requires a targetCell`);
        }
        return {
            kind: EffectKind.Vision,
            center: targetCell,
            range: effectConfig.range,
        };
    }

    public calculateWinner() {
        const gameState = this.gsm.gameState;
        const losers = new Set();

        try {
            const flagships = gameState.ships.filter((s) => s.isFlagship);

            flagships.forEach((fs) => {
                if (fs.destroyed) {
                    losers.add(fs.playerId);
                }
            });

            const players = gameState.players.map((p) => p.id);

            if (losers.size === players.length) {
                return { type: ResultType.SUCCESS, winners: players, isOver: true }; // Game end: Draw
            }

            if (losers.size === players.length - 1) {
                const winners = players.filter((p) => !losers.has(p));
                return { type: ResultType.SUCCESS, winners, isOver: true }; // Game end: 1 winner
            }

            return { type: ResultType.SUCCESS, winners: [], isOver: false }; // Game continues
        } catch (error) {
            return { type: ResultType.ERROR, error };
        }
    }

    // ================= Helpers =================

    private getPlayerIndex(playerId: string): number {
        return this.gameState.players.findIndex((p) => p.id === playerId);
    }

    private isFirstPlayer(playerId: string) {
        return this.gsm.gameState.getFirstPlayerId() === playerId;
    }
}
