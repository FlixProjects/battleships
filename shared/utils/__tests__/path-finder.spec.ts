import { CELL_SEPARATOR } from "@shared/constants";
import { Movement } from "@shared/models/Movement";
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
    });
});
