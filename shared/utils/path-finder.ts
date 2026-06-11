import { BOARD_COLUMNS, BOARD_ROWS } from "@shared/constants";
import { Movement } from "@shared/models/Movement";
import { ICellLoc } from "@shared/types";
import { keyToLocation, locationToKey } from "./helpers";

interface ITravellerProps {
    current?: PathNode;
    route?: string[];
    movement: Movement;
    onStopCb?: () => void;
}

interface IPathFinderProps {
    xLowerBound: number;
    yLowerBound: number;
    xUpperBound: number;
    yUpperBound: number;
}

export interface ICellsWithinRangeOptions {
    start: ICellLoc;
    range: number;
    filterFn?: NodeFilterFn;
}

const DEFAULT_BOUNDS = {
    xLowerBound: 0,
    yLowerBound: 0,
    xUpperBound: BOARD_COLUMNS - 1,
    yUpperBound: BOARD_ROWS - 1,
};

export const cellLocToNodeId = locationToKey;
export const nodeIdToCellLoc = keyToLocation;
export const routeToCellLocs = (route: string[]): ICellLoc[] => route.map(nodeIdToCellLoc);

export type NodeFilterFn = (loc: ICellLoc) => boolean;

export class PathFinder {
    private nodes: Map<string, PathNode> = new Map();
    private xLowerBound = DEFAULT_BOUNDS.xLowerBound;
    private yLowerBound = DEFAULT_BOUNDS.yLowerBound;
    private xUpperBound = DEFAULT_BOUNDS.xUpperBound;
    private yUpperBound = DEFAULT_BOUNDS.yUpperBound;
    private travellers: Traveller[] = [];
    private routes: Map<string, string[][]> = new Map();

    constructor(props: Partial<IPathFinderProps> = {}) {
        if (props.xLowerBound !== undefined) this.xLowerBound = props.xLowerBound;
        if (props.yLowerBound !== undefined) this.yLowerBound = props.yLowerBound;
        if (props.xUpperBound !== undefined) this.xUpperBound = props.xUpperBound;
        if (props.yUpperBound !== undefined) this.yUpperBound = props.yUpperBound;
    }

    public getNode(nodeId: string) {
        return this.nodes.get(nodeId);
    }

    public getPathToNode(travellerProps: ITravellerProps, endNodeId: string) {
        this.run(travellerProps);
        return this.dedupeRoutes(this.routes.get(endNodeId) ?? []);
    }

    public getReachableCells(travellerProps: ITravellerProps): string[] {
        this.run(travellerProps);
        const startId = travellerProps.current?.id;
        return Array.from(this.routes.keys()).filter((id) => id !== startId);
    }

    public static getCellsWithinRange({ start, range, filterFn }: ICellsWithinRangeOptions): ICellLoc[] {
        const pathFinder = new PathFinder();
        pathFinder.initialiseNodes(filterFn);
        return pathFinder.cellsWithinRange(start, range);
    }

    public cellsWithinRange(start: ICellLoc, range: number): ICellLoc[] {
        const startNode = this.nodes.get(cellLocToNodeId(start));
        if (!startNode) return [];

        const visited = new Set<string>([startNode.id]);
        const reachable: string[] = [];
        let frontier: PathNode[] = [startNode];

        for (let step = 0; step < range; step++) {
            const next: PathNode[] = [];
            frontier.forEach((node) => {
                node.nextTo.forEach((neighbour) => {
                    if (visited.has(neighbour.id) || !neighbour.isEnterable()) return;
                    visited.add(neighbour.id);
                    reachable.push(neighbour.id);
                    next.push(neighbour);
                });
            });
            if (next.length === 0) break;
            frontier = next;
        }

        return reachable.map(nodeIdToCellLoc);
    }

    public initialiseNodes(filterFn?: NodeFilterFn) {
        this.nodes.clear();
        this.createAndLoadIdForNodes(filterFn);
        this.loadNextNodesForNodes();
    }

    private run(travellerProps: ITravellerProps) {
        this.reset();
        this.sendTraveller(travellerProps);
        this.registerRoutesFromTravellers();
    }

    private dedupeRoutes(routes: string[][]): string[][] {
        const seen = new Set<string>();
        const unique: string[][] = [];
        routes.forEach((r) => {
            const key = r.join(">");
            if (seen.has(key)) return;
            seen.add(key);
            unique.push(r);
        });
        return unique;
    }

    private reset() {
        this.travellers = [];
        this.routes.clear();
    }

    private createAndLoadIdForNodes(filterFn?: NodeFilterFn) {
        for (let x = this.xLowerBound; x <= this.xUpperBound; x++) {
            for (let y = this.yLowerBound; y <= this.yUpperBound; y++) {
                const id = cellLocToNodeId([x, y]);
                const enterable = filterFn ? filterFn([x, y]) : true;
                this.nodes.set(id, new PathNode(id, [], enterable));
            }
        }
    }

    private loadNextNodesForNodes() {
        this.nodes.forEach((node) => {
            this.loadNextNodesForNode(node);
        });
    }

    private loadNextNodesForNode(node: PathNode) {
        const [x, y] = nodeIdToCellLoc(node.id);
        const nextTo: PathNode[] = [];

        if (x > this.xLowerBound) this.pushIfExists(nextTo, this.nodes.get(cellLocToNodeId([x - 1, y])));
        if (x < this.xUpperBound) this.pushIfExists(nextTo, this.nodes.get(cellLocToNodeId([x + 1, y])));
        if (y > this.yLowerBound) this.pushIfExists(nextTo, this.nodes.get(cellLocToNodeId([x, y - 1])));
        if (y < this.yUpperBound) this.pushIfExists(nextTo, this.nodes.get(cellLocToNodeId([x, y + 1])));

        node.nextTo = nextTo;
    }

    private sendTraveller(travellerProps: ITravellerProps) {
        const traveller = new Traveller(
            {
                current: travellerProps.current,
                movement: travellerProps.movement ?? new Movement(),
                onStopCb: travellerProps.onStopCb,
            },
            (tvlr) => {
                this.travellers.push(tvlr);
            },
        );

        traveller.start();
        return traveller;
    }

    private registerRoutesFromTravellers() {
        this.travellers.forEach((traveller) => {
            const destination = traveller.route[traveller.route.length - 1];
            const existingRoute = this.routes.get(destination);
            if (!existingRoute) {
                this.routes.set(destination, [traveller.route]);
            } else {
                existingRoute.push(traveller.route);
            }
        });
    }

    private pushIfExists<T>(arr: T[], ele?: T) {
        if (ele !== undefined) arr.push(ele);
    }

    public get _testExports() {
        return {
            nodes: this.nodes,
            travellers: this.travellers,
            routes: this.routes,
        };
    }
}

export class PathNode {
    constructor(
        public id: string,
        public nextTo: PathNode[] = [],
        private enterable: boolean = true,
    ) {}

    public canBeEntered(_traveller: Traveller): boolean {
        return this.enterable;
    }

    public isEnterable(): boolean {
        return this.enterable;
    }

    public receive(traveller: Traveller) {
        this.onEnter(traveller);
        this.sendToNextNodes(traveller);
    }

    public sendToNextNodes(traveller: Traveller) {
        let canStillMoveToNextNode = false;
        this.nextTo.forEach((nextNode) => {
            if (traveller.canEnterNextNode(nextNode) && nextNode.canBeEntered(traveller)) {
                canStillMoveToNextNode = true;
                traveller.copy().enter(nextNode);
            }
        });
        if (!canStillMoveToNextNode) {
            traveller.stop();
        }
    }

    public onEnter(traveller: Traveller) {
        traveller.onEnterNextNode(this);
        traveller.recordRoute(this);
        traveller.updateCurrent(this);
    }
}

class Traveller {
    private isStopped: boolean = false;
    public current?: PathNode;
    public route: string[];
    public onStopCb?: () => void;
    public reportBackIn: (traveller: Traveller) => void;
    public movement: Movement;

    constructor(props: ITravellerProps, reportBackIn: (traveller: Traveller) => void) {
        this.current = props.current;
        this.route = props.route ?? [];
        this.movement = props.movement;
        this.onStopCb = props.onStopCb;
        this.reportBackIn = reportBackIn;
    }

    public start() {
        if (!this.current) return;
        this.route = [this.current.id];
        this.current.sendToNextNodes(this);
    }

    public enter(node: PathNode) {
        node.receive(this);
    }

    public recordRoute(node: PathNode) {
        this.route.push(node.id);
        this.reportBackIn(this);
    }

    public updateCurrent(node: PathNode) {
        this.current = node;
    }

    public stop() {
        this.isStopped = true;
        this.onStop();
    }

    public canEnterNextNode(_node: PathNode): boolean {
        if (this.isStopped) return false;
        if (!this.movement.stillPossible) return false;
        return true;
    }

    public onEnterNextNode(_node: PathNode) {
        this.resolveMovement();
    }

    private resolveMovement(resolveEffects?: (traveller: Traveller) => void) {
        resolveEffects?.(this);
        this.movement.resolve();
    }

    public loadMovement(movement: Movement = new Movement()) {
        this.movement = movement;
    }

    private onStop() {
        this.onStopCb?.();
    }

    public copy() {
        return new Traveller(
            {
                current: this.current,
                route: [...this.route],
                onStopCb: this.onStopCb,
                movement: new Movement({
                    originalMovementCost: this.movement.originalMovementCost,
                    unitsOfMovementLeft: this.movement.unitsOfMovementLeft,
                    unitsOfMovementUsed: this.movement.unitsOfMovementUsed,
                    movementCost: this.movement.movementCost,
                }),
            },
            this.reportBackIn,
        );
    }
}
