import { HullCalculator } from "../hull-helper";
import { IGameStateManager, ICellLoc, IGameStateData } from "@shared/types";
import { BOARD_COLUMNS, BOARD_ROWS } from "@shared/constants";

describe("HullCalculator", () => {
    let mockGSM: IGameStateManager;
    let mockGameState: IGameStateData;

    beforeEach(() => {
        mockGameState = {
            code: "TEST",
            players: [],
            ships: [],
            hulls: [],
            cards: [],
            decks: [],
            board: {},
            winners: [],
            isOver: false,
            currentRound: 0,
        };
        mockGSM = { gameState: mockGameState } as IGameStateManager;
    });

    describe("getDeployedHullLocation", () => {
        it("should calculate deployed location for first player", () => {
            const calculator = new HullCalculator(mockGSM, true);
            const result = calculator.getDeployedHullLocation([1, 1], [0, 1]);
            expect(result).toEqual([1, 2]);
        });

        it("should invert Y for second player", () => {
            const calculator = new HullCalculator(mockGSM, false);
            const result = calculator.getDeployedHullLocation([1, 1], [0, 1]);
            expect(result).toEqual([1, 0]);
        });

        it("should handle zero offsets", () => {
            const calculator = new HullCalculator(mockGSM, true);
            const result = calculator.getDeployedHullLocation([2, 2], [0, 0]);
            expect(result).toEqual([2, 2]);
        });
    });

    describe("getDeployedHullLocations", () => {
        it("should calculate multiple hull locations for first player", () => {
            const calculator = new HullCalculator(mockGSM, true);
            const result = calculator.getDeployedHullLocations(
                [1, 1],
                [
                    [0, 0],
                    [0, 1],
                ],
            );
            expect(result).toEqual([
                [1, 1],
                [1, 2],
            ]);
        });

        it("should calculate multiple hull locations for second player", () => {
            const calculator = new HullCalculator(mockGSM, false);
            const result = calculator.getDeployedHullLocations(
                [1, 2],
                [
                    [0, 0],
                    [0, 1],
                ],
            );
            expect(result).toEqual([
                [1, 2],
                [1, 1],
            ]);
        });
    });

    describe("getValidDeploymentLocations", () => {
        it("should return all locations when board is empty", () => {
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [
                [0, 0],
                [1, 0],
                [2, 0],
            ];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [[0, 0]]);
            expect(result).toEqual([
                [0, 0],
                [1, 0],
                [2, 0],
            ]);
        });

        it("should filter out occupied locations", () => {
            mockGameState.hulls = [{ location: [1, 0], destroyed: false } as any];
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [
                [0, 0],
                [1, 0],
                [2, 0],
            ];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [[0, 0]]);
            expect(result).toEqual([
                [0, 0],
                [2, 0],
            ]);
        });

        it("should filter out locations that exceed board boundaries", () => {
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [
                [0, BOARD_ROWS - 1],
                [1, BOARD_ROWS - 1],
            ];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [
                [0, 0],
                [0, 1],
            ]);
            expect(result).toEqual([]);
        });

        it("should handle multi-hull ships (vertical)", () => {
            mockGameState.hulls = [{ location: [1, 1], destroyed: false } as any];
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [
                [1, 0],
                [2, 0],
            ];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [
                [0, 0],
                [0, 1],
            ]);
            expect(result).toEqual([[2, 0]]);
        });

        it("should handle multi-hull ships (horizontal)", () => {
            mockGameState.hulls = [{ location: [1, 1], destroyed: false } as any];
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [
                [1, 0],
                [BOARD_COLUMNS - 1, 0],
            ];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [
                [0, 0],
                [1, 0],
            ]);
            expect(result).toEqual([[1, 0]]);
        });

        it("should ignore destroyed hulls", () => {
            mockGameState.hulls = [{ location: [1, 0], destroyed: true } as any];
            const calculator = new HullCalculator(mockGSM, true);
            const selectableLocations: ICellLoc[] = [[1, 0]];
            const result = calculator.getValidDeploymentLocations(selectableLocations, [[0, 0]]);
            expect(result).toEqual([[1, 0]]);
        });
    });
});
