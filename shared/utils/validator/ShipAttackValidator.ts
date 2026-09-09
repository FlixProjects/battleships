import { ERROR_MESSAGES } from "@shared/constants";
import { Ship } from "@shared/models/Ship";
import { ErrorType, IErrorResult, IGameState, IShip, IShipAttackAction, ResultType } from "@shared/types";
import { locationToKey } from "@shared/utils";
import { PathFinder } from "@shared/utils/path-finder";
import { BaseError } from "../error/BaseError";
import { Validator } from "./Validator";

export class ShipAttackValidator extends Validator {
    constructor(
        private readonly gameState: IGameState,
        private readonly attackAction: IShipAttackAction,
    ) {
        super();
    }

    validate() {
        try {
            // Server validation
            this.validateShipExists();
            this.validateAttackLocationsProvided();
            this.validateWithinBoardBounds();

            // Game validation
            this.validateShipNotDestroyed();
            this.validateAttacksRemaining();
            this.validateWithinAttackRange();

            return { type: ResultType.SUCCESS, playerId: this.attackAction.playerId };
        } catch (error) {
            return error as IErrorResult;
        }
    }

    private getShip(): IShip {
        const { shipId } = this.attackAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);
        if (!ship) {
            throw new BaseError({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
                message: "Ship not found",
            });
        }
        return ship;
    }

    private validateShipExists() {
        const { shipId } = this.attackAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);
        const shipHulls = this.gameState.hulls?.filter((h) => h.shipId === shipId);

        if (!ship?.deployed || !shipHulls?.[0]) {
            throw new BaseError({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
                message: "Ship not found or not deployed",
            });
        }
    }

    private validateAttackLocationsProvided() {
        const { attackLocations } = this.attackAction;

        if (!attackLocations?.length) {
            throw new BaseError({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
                message: "No attack locations provided",
            });
        }
    }

    private validateWithinBoardBounds() {
        const { attackLocations } = this.attackAction;
        const { rows, cols } = this.gameState.getBoardDimensions();
        const isWithinBounds = attackLocations.every(([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows);

        if (!isWithinBounds) {
            throw new BaseError({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
                message: "Attack location is out of board bounds",
            });
        }
    }

    private validateShipNotDestroyed() {
        if (this.getShip().destroyed) {
            throw new BaseError({
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.TARGET_SHIP_ALREADY_DESTROYED,
                message: "Ship is destroyed and cannot attack",
            });
        }
    }

    private validateAttacksRemaining() {
        if (this.getShip().remainingAttacks <= 0) {
            throw new BaseError({
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.ATTACK_ERROR_NO_ATTACKS_REMAINING,
                message: "Ship has no attacks remaining this turn",
            });
        }
    }

    private validateWithinAttackRange() {
        const { attackLocations } = this.attackAction;
        const ship = new Ship(this.getShip());

        const cellsInRange = PathFinder.getCellsWithinRange({
            start: ship.getFrontHull().location,
            range: ship.attackRange || 0,
            minRange: ship.attackMinRange,
        }).map((loc) => locationToKey(loc));

        const isWithinRange = attackLocations.every((loc) => cellsInRange.includes(locationToKey(loc)));

        if (!isWithinRange) {
            throw new BaseError({
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.ATTACK_ERROR_OUT_OF_RANGE,
                message: "Attack location is out of the ship's attack range",
            });
        }
    }
}
