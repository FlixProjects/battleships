import {
    BOARD_COLUMNS,
    BOARD_ROWS,
    ERROR_CODE,
    IErrorResult,
    LocationHelper,
    locationToKey,
    PathHelper
} from "../..";
import { IGameState, IMoveAction, ResultType } from "../../types";
import { Validator } from "./Validator";

export class MoveShipValidator extends Validator {
    private readonly pathHelper = new PathHelper();
    constructor(
        private readonly gameState: IGameState,
        private readonly moveAction: IMoveAction,
    ) {
        super();
    }

    validate() {
        try {
            this.validateShipExists();
            this.validateWithinBoardBounds();
            this.validateDestinationNotOccupied();
            this.validateWithinMovementRange();

            return { type: ResultType.SUCCESS, playerId: this.moveAction.playerId };
        } catch (error: any) {
            return error as IErrorResult;
        }
    }

    private validateShipExists() {
        const { shipId } = this.moveAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);
        const shipHulls = this.gameState.hulls.filter((h) => h.shipId === shipId);

        if (!ship?.deployed || !shipHulls?.[0]) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.SYS_NOT_FOUND,
                message: "Ship not found or not deployed",
            };
        }
    }

    private validateWithinBoardBounds() {
        const { hullLocations: newLocation } = this.moveAction;

        const isWithinBounds = newLocation.every((hullLoc) => {
            const [x, y] = hullLoc.location;
            return x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS;
        });

        if (!isWithinBounds) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.SYS_INVALID_PARAMS,
                message: "Destination location is out of board bounds",
            };
        }
    }

    private validateWithinMovementRange() {
        const { shipId, hullLocations: newLocations } = this.moveAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);

        const currentLoc = ship.hulls[0].location;
        const movementRange = ship.movementRange || 0;

        const reachableCells = this.pathHelper.getReachableCells({
            start: currentLoc,
            range: movementRange,
        });

        const reachableCellsKeys = reachableCells.map((loc) => locationToKey(loc));
        const newLocationKeys = newLocations.map((newHullLoc) => locationToKey(newHullLoc.location));

        const isReachable = newLocationKeys.every((newLoc) => reachableCellsKeys.includes(newLoc));

        if (!isReachable) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.MOVE_ERROR_INSUFFICIENT_MOVEMENT,
                message: "Destination location is out of movement range",
            };
        }
    }

    private validateDestinationNotOccupied() {
        const { shipId, hullLocations: newLocations } = this.moveAction;
        // Exclude current ship from occupied cells check
        const players = this.gameState.players.map((p) => ({
            ...p,
            ships: p.ships.map((s) => (s.id === shipId ? { ...s, hulls: [] } : s)),
        }));

        const locationHelper = new LocationHelper(players);

        if (locationHelper.isLocationOccupied(newLocations[0].location)) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.MOVE_ERROR_LOCATION_OCCUPIED,
                message: "Destination location is occupied",
            };
        }
    }
}
