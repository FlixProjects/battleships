import { CELL_SEPARATOR } from "@shared/constants";
import { PathFinder } from "../path-finder";

const createCellId = (x: number, y: number) => x.toString() + CELL_SEPARATOR + y.toString();

describe("PathFinder", () => {
    describe("initialiseNodes", () => {
        it("should create all the nodes", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 1,
                yUpperBound: 2,
            });

            pathFinder.initialiseNodes();

            const expectedNodeIds = [
                createCellId(0, 0),
                createCellId(0, 1),
                createCellId(0, 2),
                createCellId(1, 0),
                createCellId(1, 1),
                createCellId(1, 2),
            ];

            expect(pathFinder.nodes.size).toBe(expectedNodeIds.length);

            expectedNodeIds.forEach((id) => {
                expect(pathFinder.nodes.has(id)).toBe(true);
            });
        });
        it("should assign values of nextNode", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 1,
                yUpperBound: 1,
            });
            pathFinder.initialiseNodes();

            expect(pathFinder.nodes.get(createCellId(0, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(1, 0))?.id,
                pathFinder.nodes.get(createCellId(0, 1))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(1, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(0, 1))?.id,
                pathFinder.nodes.get(createCellId(1, 0))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(0, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(1, 1))?.id,
                pathFinder.nodes.get(createCellId(0, 0))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(1, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(0, 0))?.id,
                pathFinder.nodes.get(createCellId(1, 1))?.id,
            ]);
        });

        it("should assign values of nextNode", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });
            pathFinder.initialiseNodes();

            expect(pathFinder.nodes.get(createCellId(0, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(1, 0))?.id,
                pathFinder.nodes.get(createCellId(0, 1))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(1, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(0, 1))?.id,
                pathFinder.nodes.get(createCellId(2, 1))?.id,
                pathFinder.nodes.get(createCellId(1, 0))?.id,
                pathFinder.nodes.get(createCellId(1, 2))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(2, 2))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(1, 2))?.id,
                pathFinder.nodes.get(createCellId(2, 1))?.id,
            ]);

            expect(pathFinder.nodes.get(createCellId(0, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.nodes.get(createCellId(1, 1))?.id,
                pathFinder.nodes.get(createCellId(0, 0))?.id,
                pathFinder.nodes.get(createCellId(0, 2))?.id,
            ]);
        });
    });
});
