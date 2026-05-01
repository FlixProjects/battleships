import { BOARD_COLUMNS, BOARD_ROWS, CELL_SEPARATOR } from "@shared/constants";
import { Movement } from "@shared/models/Movement";
import { mergician } from "mergician";

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

const DEFAULT_BOUNDS = {
    xLowerBound: 0,
    yLowerBound: 0,
    xUpperBound: BOARD_ROWS - 1,
    yUpperBound: BOARD_COLUMNS - 1,
};

export class PathFinder {
    public nodes: Map<string, PathNode> = new Map();
    private xLowerBound = 0;
    private yLowerBound = 0;
    private xUpperBound = BOARD_ROWS - 1;
    private yUpperBound = BOARD_COLUMNS - 1;
    public travellers: Traveller[] = [];
    public routes: Map<string, string[][]> = new Map();

    constructor(props: Partial<IPathFinderProps> = DEFAULT_BOUNDS) {
        Object.assign(this, props);
    }

    public getPathToNode(startNode: PathNode, movement: Movement, endNodeId: string) {
        this.sendTraveller(startNode, movement);
        this.registerRoutesFromTravellers();
        // TODO: have a Route class
        return this.routes.get(endNodeId) ?? [];
    }

    public initialiseNodes() {
        this.createAndLoadIdForNodes();
        this.loadNextNodesForNodes();
    }

    private createAndLoadIdForNodes() {
        for (let x = this.xLowerBound; x <= this.xUpperBound; x++) {
            for (let y = this.yLowerBound; y <= this.yUpperBound; y++) {
                const id = `${x}${CELL_SEPARATOR}${y}`;
                this.nodes.set(id, new PathNode(id));
            }
        }
    }

    private loadNextNodesForNodes() {
        this.nodes.forEach((node) => {
            this.loadNextNodesForNode(node);
        });
    }

    private loadNextNodesForNode(node: PathNode) {
        const [xStr, yStr] = node.id.split(CELL_SEPARATOR);
        const x = parseInt(xStr);
        const y = parseInt(yStr);

        const nextTo: PathNode[] = [];
        if (x > this.xLowerBound) {
            nextTo.push(this.nodes.get(`${x - 1}${CELL_SEPARATOR}${y}`)!);
        }
        if (x < this.xUpperBound) {
            nextTo.push(this.nodes.get(`${x + 1}${CELL_SEPARATOR}${y}`)!);
        }
        if (y > this.yLowerBound) {
            nextTo.push(this.nodes.get(`${x}${CELL_SEPARATOR}${y - 1}`)!);
        }
        if (y < this.yUpperBound) {
            nextTo.push(this.nodes.get(`${x}${CELL_SEPARATOR}${y + 1}`)!);
        }
        node.nextTo = nextTo;
    }

    private sendTraveller(startNode: PathNode, movement?: Movement) {
        const traveller = new Traveller(
            {
                current: startNode,
                movement: movement ?? new Movement(),
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
}

export class PathNode {
    constructor(
        public id: string,
        public nextTo: PathNode[] = [],
    ) {}

    public canBeEntered(traveller: Traveller): boolean {
        return true;
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
    }

    public updateCurrent(node: PathNode) {
        this.current = node;
    }

    public stop() {
        this.isStopped = true;
        this.reportBackIn(this);
        this.onStop();
    }

    public canEnterNextNode(node: PathNode): boolean {
        // minus movement cost, check if node has special effects, etc.
        if (this.isStopped) {
            return false;
        }

        const hasStepsLeft = this.movement.stillPossible;

        if (!hasStepsLeft) {
            return false;
        }

        return true;
    }

    public onEnterNextNode(node: PathNode) {
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
        const _movement = new Movement(mergician({}, this.movement));

        return new Traveller(
            {
                ...mergician(
                    {},
                    {
                        current: this.current,
                        route: this.route,
                        onStopCb: this.onStopCb,
                        movement: _movement,
                    },
                ),
            } as ITravellerProps,
            this.reportBackIn,
        );
    }
}
