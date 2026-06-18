import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { EFFECTS_CONFIG, SUPPORTS_CONFIG } from "../config/constants";
import { GameStateManager } from "../models";
import {
    EffectAnchor,
    ICellLoc,
    IEffectConfig,
    IGameState,
    IGetValidAttackCellsAction,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IGetValidMoveCellsAction,
    IGetValidMoveCellsResult,
    IGetValidSupportCellsAction,
    IGetValidSupportCellsResult,
    ResultType,
    TEffectRefNo,
    THullCalculatorConstructor,
    TSupportRefNo,
} from "../types";
import { keyToLocation, LocationHelper, locationToKey } from "../utils";
import { boardToPathCellNodes } from "../utils/cell-node-helper";
import { cellLocToNodeId, nodeIdToCellLoc, PathFinder, routeToCellLocs } from "../utils/path-finder";
import { Movement } from "./Movement";

// TODO: move prime methods into FE Entity classes?
// TODO: eventually deprecate this
export class GameEngine {
    private gsm: GameStateManager;
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

    private primeDeployShip(action: IGetValidDeployCellsAction): IGetValidDeployCellsResult {
        const { playerId, shipId } = action;

        const availableCells: ICellLoc[] = [];
        const ship = this.gsm.getShip(shipId);
        const { rows, cols } = this.gsm.getBoardDimensions();
        const isFirstPlayer = this.isFirstPlayer(playerId);

        for (let i = 0; i < cols; i++) {
            availableCells.push([i, isFirstPlayer ? 0 : rows - 1]);
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
        pathFinder.initialiseNodes(
            (loc: ICellLoc) => !locationHelper.isLocationOccupied(loc),
            boardToPathCellNodes(this.gsm.gameState.board),
        );
        return pathFinder;
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

        const reachableCells = PathFinder.getCellsWithinRange({
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

    /**
     * Manhattan-distance reachable cells from the configured anchor. For
     * `any_tile` we treat the whole board as the seed set (no anchor cell).
     */
    private computeAnchoredCells(playerId: string, effectConfig: IEffectConfig): ICellLoc[] {
        if (effectConfig.anchor === EffectAnchor.AnyTile) {
            const all: ICellLoc[] = [];
            const { rows, cols } = this.gsm.getBoardDimensions();
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    all.push([x, y]);
                }
            }
            return all;
        }

        const anchorCells = this.getAnchorCells(playerId, effectConfig.anchor);
        const reached = new Set<string>();
        anchorCells.forEach((origin) => {
            reached.add(locationToKey(origin));
            PathFinder.getCellsWithinRange({ start: origin, range: effectConfig.range }).forEach((cell) =>
                reached.add(locationToKey(cell)),
            );
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
            const { rows, cols } = this.gsm.getBoardDimensions();
            const row = isFirstPlayer ? 0 : rows - 1;
            const cells: ICellLoc[] = [];
            for (let x = 0; x < cols; x++) cells.push([x, row]);
            return cells;
        }
        return [];
    }

    // ================= Helpers =================

    private isFirstPlayer(playerId: string) {
        return this.gsm.gameState.getFirstPlayerId() === playerId;
    }
}
