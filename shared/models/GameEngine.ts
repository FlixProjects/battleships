import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { BOARD_COLUMNS, BOARD_ROWS } from "../constants";
import { GameStateManager } from "../models";
import {
    IAttackResult,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IErrorResult,
    IGameState,
    IGetValidAttackCellsAction,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IGetValidMoveCellsAction,
    IGetValidMoveCellsResult,
    IMoveAction,
    IMoveResult,
    IPlayer,
    IResult,
    IShipAttackAction,
    ResultType,
    THullCalculatorConstructor,
} from "../types";
import { LocationHelper, locationToKey, PathHelper } from "../utils";
import { MoveShipValidator } from "../utils/validator";

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
            shipAttack: (action: IGetValidAttackCellsAction) => this.primeAttack(action),
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

    // commit should be after validation, we modify the local state
    // and prepare player action to be sent to server
    private commitDeployShip(action: IDeployAction): IDeployResult {
        const { shipId, playerId, hullLocations } = action;

        const player = this.gsm.getPlayer(playerId);
        const shipToDeploy = this.gsm.getShip(shipId);
        const commandPointCost = shipToDeploy?.commandPointCost ? shipToDeploy.commandPointCost : 0;

        shipToDeploy.deployed = true;
        shipToDeploy.addHullLocations(hullLocations);

        // FIXME: when trying to return only Partial player with necessary fields
        // ship does not deploy properly
        if (!player.pendingActions.map((a) => a.id).includes(action.id)) {
            // PATCH: do not append again when resolving locally
            // FIXME: there should be a better way handle local resolution
            player.pendingActions.push(action);
        }
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

        if (!ship?.hulls?.[0]) {
            // TODO: Should not be selectable
            return { type: ResultType.SUCCESS, playerId, validCells: [] };
        }

        const currentLoc = ship.hulls[0].location; // FIXME: We always take the first hull loc as origin
        const movementRange = ship.remainingMovement || 0;

        // FIXME: we should only take into account 'visible' ships
        const players = this.gsm.getPlayers();
        const locationHelper = new LocationHelper(players);

        const validCells = this.pathHelper.getReachableCells({
            start: currentLoc,
            range: movementRange,
            filterFn: (loc: ICellLoc) => !locationHelper.isLocationOccupied(loc),
        });

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells,
            origin: currentLoc,
        };
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
        const player = this.getPlayer(playerId);
        const ship = player.ships.find((s) => s.id === shipId);

        const currentLoc = ship.hulls[0].location;
        const attackRange = ship.attackRange || 0;

        const reachableCells = this.pathHelper.getReachableCells({
            start: currentLoc,
            range: attackRange,
            filterFn: (loc: ICellLoc) => true,
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

        const attackingShip = ships.find((s) => s.id === shipId);

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

    private getPlayer(playerId: string): IPlayer {
        return this.gameState.players.find((p) => p.id === playerId);
    }

    private getPlayerIndex(playerId: string): number {
        return this.gameState.players.findIndex((p) => p.id === playerId);
    }

    private isFirstPlayer(playerId: string) {
        return this.gsm.gameState.getFirstPlayerId() === playerId;
    }
}
