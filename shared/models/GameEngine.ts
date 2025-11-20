import {
    ActionTypes,
    BOARD_COLUMNS,
    BOARD_ROWS,
    GameState,
    ICellLoc,
    IDeployAction,
    IDeployResult,
    IErrorResult,
    IGetValidDeployCellsAction,
    IGetValidDeployCellsResult,
    IGetValidMoveCellsAction,
    IGetValidMoveCellsResult,
    IMoveAction,
    IMoveResult,
    IResult,
    LocationHelper,
    locationToKey,
    Player,
    ResultType,
} from "..";

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

        const currentLoc = ship.hullLocations[0].location;
        const movementRange = ship.remainingMovement || 0;

        // FIXME: we should only take into account 'visible' ships
        const otherPlayers = this.gameState.players.map((p) => ({
            ...p,
            ships: p.ships.map((s) => (s.id === shipId ? { ...s, hullLocations: [] } : s)),
        }));
        const locationHelper = new LocationHelper(otherPlayers);

        const validCells = this.getReachableCells(currentLoc, movementRange, locationHelper);

        return {
            type: ResultType.SUCCESS,
            playerId,
            validCells,
            origin: currentLoc,
        };
    }

    private getReachableCells(start: ICellLoc, range: number, locationHelper: LocationHelper): ICellLoc[] {
        const reachable: Set<string> = new Set();
        const queue: { loc: ICellLoc; steps: number }[] = [{ loc: start, steps: 0 }];
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
                    if (
                        x >= 0 &&
                        x < BOARD_COLUMNS &&
                        y >= 0 &&
                        y < BOARD_ROWS &&
                        !locationHelper.isLocationOccupied(neighbor)
                    ) {
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
        const player = this.getPlayer(playerId);
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
        const otherPlayers = this.gameState.players.map((p) => ({
            ...p,
            ships: p.ships.map((s) => (s.id === shipId ? { ...s, hullLocations: [] } : s)),
        }));

        const locationHelper = new LocationHelper(otherPlayers);
        const reachableCells = this.getReachableCells(currentLoc, movementRange, locationHelper);

        const reachableCellsKeys = reachableCells.map((loc) => locationToKey(loc));
        const newLocationKeys = newLocation.map((hullLoc) => locationToKey(hullLoc.location));

        const isReachable = newLocationKeys.every((newLoc) => reachableCellsKeys.includes(newLoc));

        if (!isReachable) {
            return { type: ResultType.ERROR, playerId };
        }

        return { type: ResultType.SUCCESS, playerId };
    }

    // ================= Helpers =================

    private getFirstPlayer() {
        return this.gameState.players[0];
    }

    private getPlayer(playerId: string): Player {
        return this.gameState.players.find((p) => p.id === playerId);
    }

    private isFirstPlayer(playerId: string) {
        return this.gameState.players[0].id === playerId;
    }
}
