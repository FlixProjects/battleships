import { BOARD_COLUMNS, BOARD_ROWS, CELL_SEPARATOR } from "@shared/constants";
import { Movement } from "@shared/models/Movement";
import { ICellLoc } from "@shared/types";
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

            expect(pathFinder._testExports.nodes.size).toBe(expectedNodeIds.length);

            expectedNodeIds.forEach((id) => {
                expect(pathFinder._testExports.nodes.has(id)).toBe(true);
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

            expect(pathFinder.getNode(createCellId(0, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(1, 0))?.id,
                pathFinder.getNode(createCellId(0, 1))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(1, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(0, 1))?.id,
                pathFinder.getNode(createCellId(1, 0))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(0, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(1, 1))?.id,
                pathFinder.getNode(createCellId(0, 0))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(1, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(0, 0))?.id,
                pathFinder.getNode(createCellId(1, 1))?.id,
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

            expect(pathFinder.getNode(createCellId(0, 0))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(1, 0))?.id,
                pathFinder.getNode(createCellId(0, 1))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(1, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(0, 1))?.id,
                pathFinder.getNode(createCellId(2, 1))?.id,
                pathFinder.getNode(createCellId(1, 0))?.id,
                pathFinder.getNode(createCellId(1, 2))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(2, 2))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(1, 2))?.id,
                pathFinder.getNode(createCellId(2, 1))?.id,
            ]);

            expect(pathFinder.getNode(createCellId(0, 1))?.nextTo.map((n) => n.id)).toEqual([
                pathFinder.getNode(createCellId(1, 1))?.id,
                pathFinder.getNode(createCellId(0, 0))?.id,
                pathFinder.getNode(createCellId(0, 2))?.id,
            ]);
        });
    });
    describe("getPathToNode", () => {
        it("should return the path to the node", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });

            pathFinder.initialiseNodes();
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) {
                throw new Error("No start node");
            }
            const movement = new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 });
            const travellerProps = {
                current: startNode,
                movement,
            };
            const routes = pathFinder.getPathToNode(travellerProps, createCellId(1, 1));

            expect(pathFinder._testExports.travellers.length).toBe(8);
            expect(routes.length).toBe(2);
            expect(routes[0]).toEqual([createCellId(0, 0), createCellId(1, 0), createCellId(1, 1)]);
            expect(routes[1]).toEqual([createCellId(0, 0), createCellId(0, 1), createCellId(1, 1)]);
        });

        it("should return node requiring less than max movement", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });

            pathFinder.initialiseNodes();
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) {
                throw new Error("No start node");
            }
            const movement = new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 });
            const travellerProps = {
                current: startNode,
                movement,
            };
            const routes = pathFinder.getPathToNode(travellerProps, createCellId(0, 1));

            expect(pathFinder._testExports.travellers.length).toBe(8);
            expect(routes.length).toBe(1);

            expect(routes[0]).toEqual([createCellId(0, 0), createCellId(0, 1)]);
        });

        it("should return multiple paths with different movements", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });

            pathFinder.initialiseNodes();
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) {
                throw new Error("No start node");
            }
            const movement = new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 3 });
            const travellerProps = {
                current: startNode,
                movement,
            };
            const routes = pathFinder.getPathToNode(travellerProps, createCellId(0, 1));

            expect(routes.length).toBe(6);

            expect(routes[0]).toEqual([createCellId(0, 0), createCellId(1, 0), createCellId(0, 0), createCellId(0, 1)]);
            expect(routes[1]).toEqual([createCellId(0, 0), createCellId(1, 0), createCellId(1, 1), createCellId(0, 1)]);
            expect(routes[2]).toEqual([createCellId(0, 0), createCellId(0, 1)]);
            expect(routes[3]).toEqual([createCellId(0, 0), createCellId(0, 1), createCellId(1, 1), createCellId(0, 1)]);
            expect(routes[4]).toEqual([createCellId(0, 0), createCellId(0, 1), createCellId(0, 0), createCellId(0, 1)]);
            expect(routes[5]).toEqual([createCellId(0, 0), createCellId(0, 1), createCellId(0, 2), createCellId(0, 1)]);
        });

        it("should return correct results across consecutive calls", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });
            pathFinder.initialiseNodes();
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) throw new Error("No start node");

            const firstRoutes = pathFinder.getPathToNode(
                { current: startNode, movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 }) },
                createCellId(1, 1),
            );
            const secondRoutes = pathFinder.getPathToNode(
                { current: startNode, movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 }) },
                createCellId(1, 1),
            );

            expect(secondRoutes.length).toBe(firstRoutes.length);
            expect(secondRoutes).toEqual(firstRoutes);
        });
    });

    describe("getReachableCells", () => {
        it("should return all cells within movement range, excluding the start cell", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });
            pathFinder.initialiseNodes();
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) throw new Error("No start node");

            const cells = pathFinder.getReachableCells({
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 }),
            });

            expect(cells).not.toContain(createCellId(0, 0));
            expect(cells.sort()).toEqual(
                [
                    createCellId(0, 1),
                    createCellId(0, 2),
                    createCellId(1, 0),
                    createCellId(1, 1),
                    createCellId(2, 0),
                ].sort(),
            );
        });
    });

    describe("filterFn (occupancy)", () => {
        it("should not traverse cells the filterFn rejects", () => {
            const blocked: ICellLoc = [1, 0];
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });
            pathFinder.initialiseNodes((loc) => !(loc[0] === blocked[0] && loc[1] === blocked[1]));
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) throw new Error("No start node");

            const cells = pathFinder.getReachableCells({
                current: startNode,
                movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 }),
            });

            expect(cells).not.toContain(createCellId(1, 0));
        });

        it("should filter out routes passing through rejected cells", () => {
            const pathFinder = new PathFinder({
                xLowerBound: 0,
                yLowerBound: 0,
                xUpperBound: 2,
                yUpperBound: 2,
            });
            pathFinder.initialiseNodes((loc) => !(loc[0] === 1 && loc[1] === 0));
            const startNode = pathFinder.getNode(createCellId(0, 0));
            if (!startNode) throw new Error("No start node");

            const routes = pathFinder.getPathToNode(
                { current: startNode, movement: new Movement({ originalMovementCost: 1, unitsOfMovementLeft: 2 }) },
                createCellId(1, 1),
            );

            routes.forEach((r) => expect(r).not.toContain(createCellId(1, 0)));
        });
    });

    describe("getCellsWithinRange", () => {
        const sortKeys = (cells: ICellLoc[]) => cells.map((c) => c.join(",")).sort();

        it("returns the Manhattan neighbours within range, excluding the start", () => {
            const cells = PathFinder.getCellsWithinRange({ start: [0, 0], range: 1 });

            expect(sortKeys(cells)).toEqual(
                sortKeys([
                    [1, 0],
                    [0, 1],
                ]),
            );
            expect(cells).not.toContainEqual([0, 0]);
        });

        it("expands to every cell within the given range", () => {
            const cells = PathFinder.getCellsWithinRange({ start: [0, 0], range: 2 });

            expect(sortKeys(cells)).toEqual(
                sortKeys([
                    [1, 0],
                    [0, 1],
                    [2, 0],
                    [1, 1],
                    [0, 2],
                ]),
            );
        });

        it("stays within board bounds for an oversized range", () => {
            const cells = PathFinder.getCellsWithinRange({ start: [0, 0], range: 100 });

            cells.forEach(([x, y]) => {
                expect(x).toBeGreaterThanOrEqual(0);
                expect(x).toBeLessThan(BOARD_COLUMNS);
                expect(y).toBeGreaterThanOrEqual(0);
                expect(y).toBeLessThan(BOARD_ROWS);
            });
        });

        it("does not traverse through cells the filterFn rejects", () => {
            const cells = PathFinder.getCellsWithinRange({
                start: [0, 0],
                range: 2,
                filterFn: (loc) => !(loc[0] === 1 && loc[1] === 0),
            });
            const keys = cells.map((c) => c.join(","));

            expect(keys).not.toContain("1,0"); // blocked outright
            expect(keys).not.toContain("2,0"); // only reachable via the blocked cell
            expect(keys).toContain("1,1"); // still reachable via (0,1)
        });
    });
});
