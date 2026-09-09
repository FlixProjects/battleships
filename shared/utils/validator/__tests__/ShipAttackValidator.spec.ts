import { ERROR_MESSAGES } from "@shared/constants";
import { GameStateBuilder } from "@shared/factories/game-state-builder";
import { HullBuilder } from "@shared/factories/hull-builder";
import { PlayerBuilder } from "@shared/factories/player-builder";
import { ShipBuilder } from "@shared/factories/ship-builder";
import { GameState } from "@shared/models";
import { ErrorType, ICellLoc, IErrorResult, IShip, IShipAttackAction, ResultType } from "@shared/types";
import { ActionTypes } from "@shared/types/action-types";
import { BaseError } from "@shared/utils/error/BaseError";
import { ShipAttackValidator } from "../ShipAttackValidator";

const hullBuilder = new HullBuilder({
    visionRange: 2,
    remainingHealth: 1,
    maxHealth: 1,
    templateLocation: [0, 0],
    front: true,
});

const shipBuilder = new ShipBuilder({
    refNo: "frigate0",
    name: "Frigate",
    deployed: true,
    attackRange: 3,
});

const gameStateBuilder = new GameStateBuilder();

const buildAttackAction = (overrides: Partial<IShipAttackAction> = {}): IShipAttackAction => ({
    id: "action1",
    type: ActionTypes.ATTACK,
    playerId: "player1",
    shipId: "ship1",
    round: 1,
    order: 0,
    commandPointCost: 1,
    attackLocations: [[3, 3]],
    ...overrides,
});

/**
 * player1's `ship1` sits at [1,1] with reach 3; player2's `ship2` sits at [1,4],
 * 3 steps away and so just inside it. [3,3] is empty water 4 steps out —
 * deliberately beyond that reach unless a test widens it.
 * `attackerOverrides` tweaks only the attacking ship; `hulls: []` also drops its
 * hull from the state so the "deployed but hull-less" branch can be exercised.
 */
const buildGameState = (attackerOverrides: Partial<IShip> = {}): GameState => {
    const hull1 = hullBuilder.build({ id: "hull1", shipId: "ship1", location: [1, 1] });
    const hull2 = hullBuilder.build({ id: "hull2", shipId: "ship2", location: [1, 4] });

    const ship1 = shipBuilder.build({ id: "ship1", playerId: "player1", hulls: [hull1], ...attackerOverrides });
    const ship2 = shipBuilder.build({ id: "ship2", playerId: "player2", hulls: [hull2] });

    const attackerHulls = ship1.hulls?.length ? [hull1] : [];

    return gameStateBuilder.build({
        players: [
            new PlayerBuilder({ id: "player1", name: "Player 1" }).build({ ships: [ship1] }),
            new PlayerBuilder({ id: "player2", name: "Player 2", order: 1 }).build({ ships: [ship2] }),
        ],
        ships: [ship1, ship2],
        hulls: [...attackerHulls, hull2],
    });
};

const validate = (state: GameState, action: IShipAttackAction) => new ShipAttackValidator(state, action).validate();

describe("ShipAttackValidator", () => {
    describe("valid attacks", () => {
        it("accepts an attack on an enemy hull inside the ship's range", () => {
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [[1, 4]] }));

            expect(result).toEqual({ type: ResultType.SUCCESS, playerId: "player1" });
        });

        it("accepts an attack on empty water inside the ship's range", () => {
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [[1, 2]] }));

            expect(result.type).toBe(ResultType.SUCCESS);
        });

        it("accepts an attack that covers several in-range tiles at once", () => {
            const attackLocations: ICellLoc[] = [
                [1, 2],
                [0, 1],
                [2, 1],
            ];

            const result = validate(buildGameState(), buildAttackAction({ attackLocations }));

            expect(result.type).toBe(ResultType.SUCCESS);
        });
    });

    describe("ship existence", () => {
        it("rejects an attack from a ship that is not in the game state", () => {
            const result = validate(buildGameState(), buildAttackAction({ shipId: "nope" }));

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
                message: "Ship not found or not deployed",
            });
        });

        it("rejects an attack from a ship that has not been deployed", () => {
            const result = validate(buildGameState({ deployed: false }), buildAttackAction());

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
            });
        });

        it("rejects an attack from a deployed ship that has no hulls on the board", () => {
            const result = validate(buildGameState({ hulls: [] }), buildAttackAction());

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
            });
        });
    });

    describe("attack locations", () => {
        it("rejects an attack with an empty attackLocations list", () => {
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [] }));

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
                message: "No attack locations provided",
            });
        });

        it.each([
            ["past the right edge", [5, 1]],
            ["past the bottom edge", [1, 7]],
            ["negative column", [-1, 1]],
            ["negative row", [1, -1]],
        ])("rejects an attack %s of the board", (_label, target) => {
            const action = buildAttackAction({ attackLocations: [target as ICellLoc] });

            const result = validate(buildGameState(), action);

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
                message: "Attack location is out of board bounds",
            });
        });

        it("rejects the whole action when only one of several locations is off-board", () => {
            const attackLocations: ICellLoc[] = [
                [1, 2],
                [9, 9],
            ];

            const result = validate(buildGameState(), buildAttackAction({ attackLocations }));

            expect(result).toMatchObject({ errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS });
        });
    });

    describe("ship state", () => {
        it("rejects an attack from a destroyed ship", () => {
            const result = validate(
                buildGameState({ destroyed: true }),
                buildAttackAction({ attackLocations: [[1, 2]] }),
            );

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.TARGET_SHIP_ALREADY_DESTROYED,
                message: "Ship is destroyed and cannot attack",
            });
        });

        it("rejects an attack from a ship that has already used its attacks this turn", () => {
            const result = validate(
                buildGameState({ remainingAttacks: 0 }),
                buildAttackAction({ attackLocations: [[1, 2]] }),
            );

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.ATTACK_ERROR_NO_ATTACKS_REMAINING,
                message: "Ship has no attacks remaining this turn",
            });
        });
    });

    describe("attack range", () => {
        it("rejects a target beyond the ship's attack range", () => {
            // [3,3] is 4 steps from [1,1]; the frigate reaches 3
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [[3, 3]] }));

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.ATTACK_ERROR_OUT_OF_RANGE,
                message: "Attack location is out of the ship's attack range",
            });
        });

        it("accepts that same target once the ship's range covers it", () => {
            const result = validate(buildGameState({ attackRange: 4 }), buildAttackAction());

            expect(result.type).toBe(ResultType.SUCCESS);
        });

        it("rejects the ship's own tile, which sits below the minimum range", () => {
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [[1, 1]] }));

            expect(result).toMatchObject({ errorCode: ERROR_MESSAGES.ATTACK_ERROR_OUT_OF_RANGE });
        });

        it("rejects a target inside the maximum range but below a ship's minimum range", () => {
            const result = validate(
                buildGameState({ attackRange: 5, attackMinRange: 3 }),
                buildAttackAction({ attackLocations: [[1, 2]] }),
            );

            expect(result).toMatchObject({ errorCode: ERROR_MESSAGES.ATTACK_ERROR_OUT_OF_RANGE });
        });

        it("rejects the whole action when only one of several locations is out of range", () => {
            const attackLocations: ICellLoc[] = [
                [1, 2],
                [3, 3],
            ];

            const result = validate(buildGameState(), buildAttackAction({ attackLocations }));

            expect(result).toMatchObject({ errorCode: ERROR_MESSAGES.ATTACK_ERROR_OUT_OF_RANGE });
        });
    });

    describe("check ordering", () => {
        it("reports the off-board error ahead of the out-of-range error", () => {
            const result = validate(buildGameState(), buildAttackAction({ attackLocations: [[9, 9]] }));

            expect(result).toMatchObject({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
            });
        });

        it("reports the destroyed error ahead of the out-of-range error", () => {
            const result = validate(buildGameState({ destroyed: true }), buildAttackAction());

            expect(result).toMatchObject({ errorCode: ERROR_MESSAGES.TARGET_SHIP_ALREADY_DESTROYED });
        });
    });

    describe("error shape", () => {
        it("returns a BaseError instance rather than a bare object literal", () => {
            const result = validate(buildGameState(), buildAttackAction({ shipId: "nope" }));

            expect(result).toBeInstanceOf(BaseError);
        });

        it("stamps type = ERROR on the returned error", () => {
            const result = validate(buildGameState(), buildAttackAction({ shipId: "nope" })) as IErrorResult;

            expect(result.type).toBe(ResultType.ERROR);
        });
    });
});
