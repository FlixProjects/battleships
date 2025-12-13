import { CELL_SEPARATOR } from "../../constants";
import { PathHelper } from "../path-helper";

jest.mock("uuid", () => ({
    v7: () => "uuid",
}));

const cs = CELL_SEPARATOR;

describe("PathHelper", () => {
    let ph: PathHelper;
    beforeEach(() => {
        ph = new PathHelper();
    });
    describe("getCellPaths", () => {
        it("should return the origin for a max of zero", () => {
            const result = ph.getCellPaths({ max: 0 });

            const expected = [`0${cs}0`];

            expect(result).toEqual(expected);
        });
        it("should return the origin for a max of zero and a min of zero", () => {
            const result = ph.getCellPaths({ max: 0, min: 0 });

            const expected = [`0${cs}0`];

            expect(result).toEqual(expected);
        });
        it("should return the origin for a max of zero and a min of 1", () => {
            const result = ph.getCellPaths({ max: 0, min: 1 });

            const expected: string[] = [];

            expect(result).toEqual(expected);
        });
        it("should return a string of values for max of 2", () => {
            const result = ph.getCellPaths({ max: 2 });
            const expected = [
                `0${cs}2`,
                `-1${cs}1`,
                `0${cs}1`,
                `1${cs}1`,
                `-2${cs}0`,
                `-1${cs}0`,
                `0${cs}0`,
                `1${cs}0`,
                `2${cs}0`,
                `-1${cs}-1`,
                `0${cs}-1`,
                `1${cs}-1`,
                `0${cs}-2`,
            ];
            expect(result).toEqual(expected);
        });
        it("should respect the lower bounds", () => {
            const result = ph.getCellPaths({ max: 2, xLowerBound: 0, yLowerBound: 0 });
            const expected = [`0${cs}2`, `0${cs}1`, `1${cs}1`, `0${cs}0`, `1${cs}0`, `2${cs}0`];
            expect(result).toEqual(expected);
        });
        it("should respect the upper bounds", () => {
            const result = ph.getCellPaths({ max: 3, xUpperBound: 2, yUpperBound: 2, xLowerBound: 0, yLowerBound: 0 });
            const expected = [`0${cs}2`, `1${cs}2`, `0${cs}1`, `1${cs}1`, `2${cs}1`, `0${cs}0`, `1${cs}0`, `2${cs}0`];
            expect(result).toEqual(expected);
        });
    });

    describe("calculateTotalUniqueTiles", () => {
        it("should return 1 for a max of zero", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ max: 0 });

            const expected = 1;

            expect(result).toEqual(expected);
        });
        it("should return 5 for a max of 1", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ max: 1 });

            const expected = 5;

            expect(result).toEqual(expected);
        });
        it("should return 13 for a max of 2", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ max: 2 });

            const expected = 13;

            expect(result).toEqual(expected);
        });
        it("should return 25 for a max of 3", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ max: 3 });

            const expected = 25;

            expect(result).toEqual(expected);
        });
        it("should return 0 for a min more than max", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ min: 4, max: 3 });

            const expected = 0;

            expect(result).toEqual(expected);
        });
        it("should return the 4 * n if min is equal to max", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ min: 4, max: 4 });

            const expected = 16;

            expect(result).toEqual(expected);
        });
        it("should return N(3) minus N(1) if the min is 1 and the max is 3", () => {
            const result = ph.__testExports.calculateTotalUniqueTiles({ min: 1, max: 3 });

            const expected = 24;

            expect(result).toEqual(expected);
        });
    });

    describe("isValidCell", () => {
        it.each([
            // on the spot
            [[0, 0], { max: 0, origin: [0, 0], min: 0 }, true],
            // range of 1
            [[1, 0], { max: 1, origin: [0, 0], min: 0 }, true],
            [[0, 1], { max: 1, origin: [0, 0], min: 0 }, true],
            [[0, -1], { max: 1, origin: [0, 0], min: 0 }, true],
            [[-1, 0], { max: 1, origin: [0, 0], min: 0 }, true],
            [[0, 0], { max: 1, origin: [0, 0], min: 0 }, true],
            // range of 2
            [[2, 0], { max: 2, origin: [0, 0], min: 0 }, true],
            [[1, 1], { max: 2, origin: [0, 0], min: 0 }, true],
            [[-1, -1], { max: 2, origin: [0, 0], min: 0 }, true],
            [[0, -2], { max: 2, origin: [0, 0], min: 0 }, true],
            // lower bounds
            // on the spot
            [[0, 0], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0, yLowerBound: 0 }, true],
            // lower than lowerBounds
            [[-1, 1], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0, yLowerBound: 0 }, false],
            [[1, -1], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0, yLowerBound: 0 }, false],
            // on lowerBounds
            [[-1, 1], { max: 5, origin: [0, 0], min: 0, xLowerBound: -1, yLowerBound: 0 }, true],
            [[1, -1], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0, yLowerBound: -1 }, true],
            // within lowerBounds
            [[-1, 1], { max: 5, origin: [0, 0], min: 0, xLowerBound: -2, yLowerBound: 0 }, true],
            [[1, -1], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0, yLowerBound: -2 }, true],
            // lowerBounds is undefined
            [[-1, 0], { max: 5, origin: [0, 0], min: 0, yLowerBound: 0 }, true],
            [[0, -1], { max: 5, origin: [0, 0], min: 0, xLowerBound: 0 }, true],
            // upper bounds
            // lower than upperBounds
            [[-1, 1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 0, yUpperBound: 0 }, false],
            [[1, -1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 0, yUpperBound: 0 }, false],
            // on upperBounds
            [[1, 0], { max: 5, origin: [0, 0], min: 0, xUpperBound: 1, yUpperBound: 0 }, true],
            [[0, 1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 0, yUpperBound: 1 }, true],
            [[2, 2], { max: 3, origin: [0, 0], min: 0, xUpperBound: 2, yUpperBound: 2 }, false], // out-of-range
            // within upperBounds
            [[1, -1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 2, yUpperBound: 0 }, true],
            [[-1, 1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 0, yUpperBound: 2 }, true],
            // upperBounds is undefined
            [[-1, 0], { max: 5, origin: [0, 0], min: 0, yUpperBound: 0 }, true],
            [[0, -1], { max: 5, origin: [0, 0], min: 0, xUpperBound: 0 }, true],
            // offset origin
            [[-1, 3], { max: 3, origin: [-1, -1], min: 0 }, false],
            [[-2, 2], { max: 3, origin: [-1, -1], min: 0 }, false],
            [[-1, 2], { max: 3, origin: [-1, -1], min: 0 }, true],
        ])("should return true for a cell within the bounds", (currCell, options, expected) => {
            const result = ph.__testExports.isValidCell(currCell as any, options as any);

            expect(result).toEqual(expected);
        });
    });
});
