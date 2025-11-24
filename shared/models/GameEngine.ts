import {
    ActionTypes,
    BOARD_COLUMNS,
    BOARD_ROWS,
    GameState,
    IAttackResult,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IErrorResult,
    IGetValidAttackCellsAction,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IGetValidMoveCellsAction,
    IGetValidMoveCellsResult,
    IMoveAction,
    IMoveResult,
    IResult,
    IShipAttackAction,
    LocationHelper,
    locationToKey,
    Player,
    ResultType,
} from "..";

interface IReachableCellOptions {
    start: ICellLoc;
    range: number;
    minRange?: number;
    filterFn?: (cellLoc: ICellLoc) => boolean;
}
// TODO: migrate to a more signal based approach
// GameEngine receives commands/signals from UI and updates the GameManager state
// updateComponents() then allows rendering of UI based on the updated state
// GameEngine should not have access to frontend methods
export class GameEngine {
    constructor(public gameState: GameState) {}

    get prime() {
        return {
            deployShip: (action: IGetValidDeployCellsAction) => this.primeDeployShip(action),
            moveShip: (action: IGetValidMoveCellsAction) => this.primeMoveShip(action),
            shipAttack: (action: IGetValidAttackCellsAction) => this.primeAttack(action),
        };
    }

    get commit() {
        return {
            deployShip: (action: IDeployAction): IDeployResult | IErrorResult<any> => {
                const results = this.validateDeployShip(action);
                if (results.type === ResultType.SUCCESS) {
                    return this.commitDeployShip(action);
                }
                return { ...results, type: ResultType.ERROR }; // TODO: better handle typing
            },
            moveShip: (action: IMoveAction): IMoveResult | IErrorResult<any> => {
                const results = this.validateMoveShip(action);
                if (results.type === ResultType.SUCCESS) {
                    return this.commitMoveShip(action);
                }
                return { ...results, type: ResultType.ERROR };
            },
            shipAttack: (action: IShipAttackAction): IAttackResult | IErrorResult<any> => {
                // TODO: validate
                return this.commitAttack(action);
            },
        };
    }

    private primeDeployShip(action: IGetValidDeployCellsAction): IGetValidDeployCellsResult {
        const { playerId } = action;

        const availableCells: ICellLoc[] = [];

        const isFirstPlayer = this.isFirstPlayer(playerId);

        for (let i = 0; i < BOARD_COLUMNS; i++) {
            availableCells.push([i, isFirstPlayer ? 0 : BOARD_ROWS - 1]);
        }

        const validCells = new LocationHelper(this.gameState.players).getAvailableCells(availableCells);

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

        const player = this.getPlayer(playerId);

        const deployedShip = player.ships.find((ship) => ship.id === shipId);

        const commandPointCost = deployedShip?.commandPointCost ? deployedShip.commandPointCost : 0;

        const deployAction: IDeployAction = {
            type: ActionTypes.DEPLOY,
            shipId,
            hullLocations,
            playerId,
            commandPointCost,
        };

        deployedShip.deployed = true;
        deployedShip.hullLocations = hullLocations;

        player.pendingActions = [...player.pendingActions, deployAction];
        player.commandPoints -= commandPointCost;

        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
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
        const player = this.getPlayer(playerId);
        const ship = player.ships.find((s) => s.id === shipId);

        if (!ship?.hullLocations?.[0]) {
            // TODO: Should not be selectable
            return { type: ResultType.SUCCESS, playerId, validCells: [] };
        }

        const currentLoc = ship.hullLocations[0].location; // FIXME: We always take the first hull loc as origin
        const movementRange = ship.remainingMovement || 0;

        // FIXME: we should only take into account 'visible' ships
        const players = this.gameState.players.map((p) => ({
            ...p,
            ships: p.ships.map((s) => (s.id === shipId ? { ...s, hullLocations: [] } : s)),
        }));
        const locationHelper = new LocationHelper(players);

        const validCells = this.getReachableCells({
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

    private getReachableCells({
        start,
        range,
        minRange = 0,
        filterFn = () => true,
    }: IReachableCellOptions): ICellLoc[] {
        const reachable: Set<string> = new Set();

        const queue: { loc: ICellLoc; steps: number }[] = [{ loc: start, steps: minRange }];
        const visited: Set<string> = new Set();

        while (queue.length > 0) {
            const { loc, steps } = queue.shift()!;
            const key = `${loc[0]},${loc[1]}`;

            if (visited.has(key) || steps > range) continue;
            visited.add(key);

            if (steps > 0) {
                reachable.add(key);
            }

            if (steps < range) {
                const neighbors: ICellLoc[] = [
                    [loc[0], loc[1] - 1], // up
                    [loc[0], loc[1] + 1], // down
                    [loc[0] - 1, loc[1]], // left
                    [loc[0] + 1, loc[1]], // right
                ];

                neighbors.forEach((neighbor) => {
                    const [x, y] = neighbor;
                    if (x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS && filterFn?.(neighbor)) {
                        queue.push({ loc: neighbor, steps: steps + 1 });
                    }
                });
            }
        }

        return Array.from(reachable).map((key) => {
            const [x, y] = key.split(",").map(Number);
            return [x, y] as ICellLoc;
        });
    }

    private commitMoveShip(action: IMoveAction): IMoveResult {
        const { shipId, playerId, hullLocations: newLocation, commandPointCost } = action;
        const player = { ...this.getPlayer(playerId) };
        const ship = player.ships.find((s) => s.id === shipId);

        if (ship?.hullLocations?.[0]) {
            ship.hullLocations = newLocation;
        }

        const moveAction: IMoveAction = {
            type: ActionTypes.MOVE,
            shipId,
            hullLocations: newLocation,
            playerId,
            commandPointCost,
        };

        player.pendingActions = [...player.pendingActions, moveAction];

        player.commandPoints -= commandPointCost;
        ship.remainingMovement = 0;

        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
        };
    }

    public validateMoveShip(moveAction: IMoveAction): IResult {
        const { playerId, shipId, hullLocations: newLocation } = moveAction;
        const player = this.getPlayer(playerId);
        const ship = player.ships.find((s) => s.id === shipId);

        if (!ship?.deployed || !ship.hullLocations?.[0]) {
            return { type: ResultType.ERROR, playerId };
        }

        const currentLoc = ship.hullLocations[0].location;
        const movementRange = ship.movementRange || 0;

        // Exclude current ship from occupied cells check
        const players = this.gameState.players.map((p) => ({
            ...p,
            ships: p.ships.map((s) => (s.id === shipId ? { ...s, hullLocations: [] } : s)),
        }));

        const locationHelper = new LocationHelper(players);
        const reachableCells = this.getReachableCells({
            start: currentLoc,
            range: movementRange,
            filterFn: (loc: ICellLoc) => !locationHelper.isLocationOccupied(loc),
        });

        const reachableCellsKeys = reachableCells.map((loc) => locationToKey(loc));
        const newLocationKeys = newLocation.map((hullLoc) => locationToKey(hullLoc.location));

        const isReachable = newLocationKeys.every((newLoc) => reachableCellsKeys.includes(newLoc));

        if (!isReachable) {
            return { type: ResultType.ERROR, playerId };
        }

        return { type: ResultType.SUCCESS, playerId };
    }

    private primeAttack(action: IGetValidAttackCellsAction) {
        const { playerId, shipId } = action;
        const player = this.getPlayer(playerId);
        const ship = player.ships.find((s) => s.id === shipId);

        const currentLoc = ship.hullLocations[0].location;
        const attackRange = ship.attackRange || 0;
        const locationHelper = new LocationHelper(this.gameState.players);

        const reachableCells = this.getReachableCells({
            start: currentLoc,
            range: attackRange,
            filterFn: (loc: ICellLoc) => !locationHelper.isLocationOccupied(loc),
        });

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells: reachableCells,
            origin: currentLoc,
        };
    }

    private commitAttack(action: IShipAttackAction) {
        const { attackLocations, playerId, shipId } = action;
        const attackingShip = this.getShip(playerId, shipId);
        const { attackCommandPointCost, attackDamage } = attackingShip;

        const attackAction: IShipAttackAction = {
            type: ActionTypes.ATTACK,
            shipId,
            attackLocations,
            playerId,
            commandPointCost: attackCommandPointCost,
        };

        // update for frontend
        const player = { ...this.getPlayer(playerId) };
        const otherPlayer = { ...this.getOtherPlayer(playerId) };
        const ships = otherPlayer.ships;

        ships?.forEach((ship) => {
            ship.hullLocations?.forEach((hull) => {
                if (attackLocations.some((loc) => locationToKey(loc) === locationToKey(hull.location))) {
                    hull.remainingHealth -= attackDamage;
                    if (hull.remainingHealth <= 0) {
                        hull.destroyed = true;
                    }
                }
            });

            const destroyedHulls = ship.hullLocations.filter((hull) => hull.destroyed);

            if (destroyedHulls.length === ship.hullLocations.length) {
                ship.destroyed = true;
            }
        });

        player.commandPoints -= attackCommandPointCost;
        attackingShip.remainingAttacks -= 1;

        // load actions for eventual submission
        player.pendingActions = [...player.pendingActions, attackAction];
        return {
            type: ResultType.SUCCESS,
            playerId,
            player,
        };
    }

    // ================= Helpers =================

    private getFirstPlayer() {
        return this.gameState.players[0];
    }

    private getShip(playerId: string, shipId: string) {
        return this.getPlayer(playerId).ships.find((s) => s.id === shipId);
    }

    private getOtherPlayer(currentPlayerId: string) {
        return this.gameState.players.find((p) => p.id !== currentPlayerId);
    }

    private getPlayer(playerId: string): Player {
        return this.gameState.players.find((p) => p.id === playerId);
    }

    private isFirstPlayer(playerId: string) {
        return this.gameState.players[0].id === playerId;
    }
}
