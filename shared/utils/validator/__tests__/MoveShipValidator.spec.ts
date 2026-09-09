import { ERROR_MESSAGES } from "@shared/constants";
import { GameStateBuilder } from "@shared/factories/game-state-builder";
import { HullBuilder } from "@shared/factories/hull-builder";
import { PlayerBuilder } from "@shared/factories/player-builder";
import { ShipBuilder } from "@shared/factories/ship-builder";
import { GameState } from "@shared/models";
import { ErrorType, IErrorResult, IHull, IMoveAction, IShip, ResultType } from "@shared/types";
import { ActionTypes } from "@shared/types/action-types";
import { BaseError } from "@shared/utils/error/BaseError";
import { MoveShipValidator } from "../MoveShipValidator";

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
});

const gameStateBuilder = new GameStateBuilder();

const buildMoveAction = (overrides: Partial<IMoveAction> = {}): IMoveAction => ({
    id: "action1",
    type: ActionTypes.MOVE,
    playerId: "player1",
    shipId: "ship1",
    round: 1,
    order: 0,
    commandPointCost: 1,
    targetCell: [1, 2],
    ...overrides,
});

/**
 * Two 1x1 ships on the default 5x7 board: player1's `ship1` at [1,1] and
 * player2's `ship2` at [3,3]. `shipOverrides` tweaks the moving ship; passing
 * `hulls: []` also drops its hull from the state so the "deployed but hull-less"
 * branch can be exercised.
 */
const buildGameState = (shipOverrides: Partial<IShip> = {}): GameState => {
    const hull1 = hullBuilder.build({ id: "hull1", shipId: "ship1", location: [1, 1] });
    const hull2 = hullBuilder.build({ id: "hull2", shipId: "ship2", location: [3, 3] });

    const ship1 = shipBuilder.build({ id: "ship1", playerId: "player1", hulls: [hull1], ...shipOverrides });
    const ship2 = shipBuilder.build({ id: "ship2", playerId: "player2", hulls: [hull2] });

    const ownHulls: IHull[] = ship1.hulls?.length ? [hull1] : [];

    return gameStateBuilder.build({
        players: [
            new PlayerBuilder({ id: "player1", name: "Player 1" }).build({ ships: [ship1] }),
            new PlayerBuilder({ id: "player2", name: "Player 2", order: 1 }).build({ ships: [ship2] }),
        ],
        ships: [ship1, ship2],
        hulls: [...ownHulls, hull2],
    });
};

describe("MoveShipValidator", () => {
    describe("valid moves", () => {
        it("accepts a move onto a free tile", () => {
            const result = new MoveShipValidator(buildGameState(), buildMoveAction()).validate();

            expect(result).toEqual({ type: ResultType.SUCCESS, playerId: "player1" });
        });

        it("ignores the moving ship's own hulls, so a move onto its current tile is not 'occupied'", () => {
            const result = new MoveShipValidator(buildGameState(), buildMoveAction({ targetCell: [1, 1] })).validate();

            expect(result.type).toBe(ResultType.SUCCESS);
        });

        it("accepts a move whose route is supplied explicitly", () => {
            const action = buildMoveAction({
                targetCell: [1, 3],
                route: [
                    [1, 1],
                    [1, 2],
                    [1, 3],
                ],
            });

            const result = new MoveShipValidator(buildGameState(), action).validate();

            expect(result.type).toBe(ResultType.SUCCESS);
        });
    });

    describe("ship existence", () => {
        it("rejects a move for a ship that is not in the game state", () => {
            const result = new MoveShipValidator(buildGameState(), buildMoveAction({ shipId: "nope" })).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
                message: "Ship not found or not deployed",
            });
        });

        it("rejects a move for a ship that has not been deployed", () => {
            const result = new MoveShipValidator(buildGameState({ deployed: false }), buildMoveAction()).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
            });
        });

        it("rejects a move for a deployed ship that has no hulls on the board", () => {
            const result = new MoveShipValidator(buildGameState({ hulls: [] }), buildMoveAction()).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorCode: ERROR_MESSAGES.SYS_NOT_FOUND,
            });
        });
    });

    describe("board bounds", () => {
        it.each([
            ["past the right edge", [5, 1]],
            ["past the bottom edge", [1, 7]],
            ["negative column", [-1, 1]],
            ["negative row", [1, -1]],
        ])("rejects a move %s", (_label, targetCell) => {
            const action = buildMoveAction({ targetCell: targetCell as [number, number] });

            const result = new MoveShipValidator(buildGameState(), action).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
                message: "Destination location is out of board bounds",
            });
        });

        it.each([
            ["top-left corner", [0, 0]],
            ["bottom-right corner", [4, 6]],
        ])("accepts a move to the %s", (_label, targetCell) => {
            const action = buildMoveAction({ targetCell: targetCell as [number, number] });

            const result = new MoveShipValidator(buildGameState(), action).validate();

            expect(result.type).toBe(ResultType.SUCCESS);
        });
    });

    describe("destination occupancy", () => {
        it("rejects a move onto a tile held by another player's ship", () => {
            const result = new MoveShipValidator(buildGameState(), buildMoveAction({ targetCell: [3, 3] })).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.MOVE_ERROR_LOCATION_OCCUPIED,
                message: "Destination location is occupied",
            });
        });

        it("allows a move onto a tile whose occupying ship is destroyed", () => {
            const gameState = buildGameState();
            const blocker = gameState.ships.find((s) => s.id === "ship2");
            if (blocker) blocker.destroyed = true;

            const result = new MoveShipValidator(gameState, buildMoveAction({ targetCell: [3, 3] })).validate();

            expect(result.type).toBe(ResultType.SUCCESS);
        });
    });

    describe("ship destroyed", () => {
        it("rejects a move for a ship that has been destroyed", () => {
            const result = new MoveShipValidator(buildGameState({ destroyed: true }), buildMoveAction()).validate();

            expect(result).toMatchObject({
                type: ResultType.ERROR,
                errorType: ErrorType.GAME,
                errorCode: ERROR_MESSAGES.TARGET_SHIP_ALREADY_DESTROYED,
                message: "Ship is destroyed and cannot move",
            });
        });

        it("accepts a move for a ship that is still alive", () => {
            const result = new MoveShipValidator(buildGameState({ destroyed: false }), buildMoveAction()).validate();

            expect(result.type).toBe(ResultType.SUCCESS);
        });

        // Server validation runs ahead of game validation, so a destroyed ship
        // aimed at an illegal tile reports the server error, not the game one.
        it("reports the board-bounds error ahead of the destroyed error", () => {
            const action = buildMoveAction({ targetCell: [5, 1] });

            const result = new MoveShipValidator(buildGameState({ destroyed: true }), action).validate();

            expect(result).toMatchObject({
                errorType: ErrorType.SERVER,
                errorCode: ERROR_MESSAGES.SYS_INVALID_PARAMS,
            });
        });
    });

    describe("error shape", () => {
        it("returns a BaseError instance rather than a bare object literal", () => {
            const result = new MoveShipValidator(buildGameState(), buildMoveAction({ shipId: "nope" })).validate();

            expect(result).toBeInstanceOf(BaseError);
        });

        it("stamps type = ERROR on the returned error without the throw site setting it", () => {
            const result = new MoveShipValidator(
                buildGameState(),
                buildMoveAction({ shipId: "nope" }),
            ).validate() as IErrorResult;

            expect(result.type).toBe(ResultType.ERROR);
        });
    });
});
