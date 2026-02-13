import { BOARD_COLUMNS, BOARD_ROWS, CELL_SEPARATOR } from "../constants";
import { ICellLoc, IGOWithVisibility, IPlayer } from "../types";
import { locationToKey } from "./helpers";

export interface IGetCellPathsOptions {
    max?: number;
    min?: number;
    origin?: ICellLoc;
    xUpperBound?: number;
    xLowerBound?: number;
    yUpperBound?: number;
    yLowerBound?: number;
}

interface IReachableCellOptions {
    start: ICellLoc;
    range: number;
    minRange?: number;
    filterFn?: (cellLoc: ICellLoc) => boolean;
}

const DEFAULT_OPTIONS: Partial<IGetCellPathsOptions> = {
    max: 0,
    min: 0,
    origin: [0, 0],
};

export class PathHelper {
    public reachableCellsSet = new Set<string>();
    public getCellPaths(_options: IGetCellPathsOptions) {
        const options = { ...DEFAULT_OPTIONS, ..._options };
        const { origin, max, xLowerBound, yLowerBound, xUpperBound, yUpperBound } = options;

        const [originX, originY] = origin;

        const maxBoundX = xUpperBound !== undefined && xUpperBound < originY + max ? xUpperBound : originY + max;
        const minBoundX = xLowerBound !== undefined && xLowerBound > originY - max ? xLowerBound : originY - max;
        const maxBoundY = yUpperBound !== undefined && yUpperBound < originX + max ? yUpperBound : originX + max;
        const minBoundY = yLowerBound !== undefined && yLowerBound > originX - max ? yLowerBound : originX - max;

        const start: ICellLoc = [minBoundX, maxBoundY];
        const end: ICellLoc = [maxBoundX, minBoundY];

        const totalCells = Math.pow(1 + 2 * max, 2);

        let currCellX = start[0];
        let currCellY = start[1];

        for (let i = 0; i < totalCells; i++) {
            if (this.isValidCell([currCellX, currCellY], options)) {
                this.reachableCellsSet.add(this.buildCellKey(currCellX, currCellY));
            }
            if (currCellX < end[0] && currCellY >= end[1]) {
                currCellX++;
            } else if (currCellY > end[1]) {
                currCellY--;
                currCellX = start[0];
            } else {
                break;
            }
        }
        return Array.from(this.reachableCellsSet.values());
    }

    // Note: not sure why we need this but its an interesting
    // mathematical pattern for calculating the no. of tiles
    private calculateTotalUniqueTiles(_options: IGetCellPathsOptions) {
        const { origin, xLowerBound, yLowerBound, min, max } = { ...DEFAULT_OPTIONS, ..._options };

        if (min > max) {
            return 0;
        }
        // N(n) = N(n-1) + 4n
        let totalUniqueTiles = min > 0 ? 0 : 1; // N(0)

        for (let n = 1; n <= max; n++) {
            if (n >= min) {
                totalUniqueTiles = totalUniqueTiles + 4 * n;
            }
        }
        return totalUniqueTiles;
    }

    private isValidCell(currCell: [number, number], _options: IGetCellPathsOptions): boolean {
        const {
            origin,
            min: _min,
            max,
            xLowerBound,
            yLowerBound,
            xUpperBound,
            yUpperBound,
        } = {
            ...DEFAULT_OPTIONS,
            ..._options,
        };

        const min = _min < 0 ? 0 : _min;

        const [originX, originY] = origin;
        const [currX, currY] = currCell;

        if (
            this.isLowerThanBound(currX, xLowerBound) ||
            this.isLowerThanBound(currY, yLowerBound) ||
            this.isHigherThanBound(currX, xUpperBound) ||
            this.isHigherThanBound(currY, yUpperBound)
        ) {
            return false;
        }

        const distance = Math.abs(currX - originX) + Math.abs(currY - originY);

        if (distance < min || distance > max) {
            return false;
        }

        return true;
    }

    public getReachableCells({ start, range, minRange = 0, filterFn = () => true }: IReachableCellOptions): ICellLoc[] {
        const reachable: Set<string> = new Set();

        const queue: { loc: ICellLoc; steps: number }[] = [{ loc: start, steps: minRange }];
        const visited: Set<string> = new Set();

        while (queue.length > 0) {
            const { loc, steps } = queue.shift()!;
            const key = `${loc[0]},${loc[1]}`;

            if (visited.has(key) || steps > range) continue;
            visited.add(key);

            if (steps > 0) {
                reachable.add(key);
            }

            if (steps < range) {
                const neighbors: ICellLoc[] = [
                    [loc[0], loc[1] - 1], // up
                    [loc[0], loc[1] + 1], // down
                    [loc[0] - 1, loc[1]], // left
                    [loc[0] + 1, loc[1]], // right
                ];

                neighbors.forEach((neighbor) => {
                    const [x, y] = neighbor;
                    if (x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS && filterFn?.(neighbor)) {
                        queue.push({ loc: neighbor, steps: steps + 1 });
                    }
                });
            }
        }

        return Array.from(reachable).map((key) => {
            const [x, y] = key.split(",").map(Number);
            return [x, y] as ICellLoc;
        });
    }

    public getVisibleTiles = (player: IPlayer): Set<string> => {
        const visible = new Set<string>();

        player.ships
            .filter((s) => s.deployed && !s.destroyed)
            .forEach((ship) => {
                const visionRange = 2; // TEMP: tiles around each ship

                ship.hulls?.forEach((hull) => {
                    visible.add(locationToKey(hull.location));
                    const cells = new PathHelper().getReachableCells({
                        start: hull.location,
                        range: visionRange,
                    });

                    cells.forEach((cell) => {
                        visible.add(locationToKey(cell));
                    });
                });
            });

        return visible;
    };

    public getVisibleTilesForPlayer = (visibilityObjects: IGOWithVisibility[]): Set<string> => {
        const visible = new Set<string>();

        visibilityObjects?.forEach((vo) => {
            visible.add(locationToKey(vo.location));
            const cells = new PathHelper().getReachableCells({
                start: vo.location,
                range: vo.visionRange,
            });

            cells.forEach((cell) => {
                visible.add(locationToKey(cell));
            });
        });

        return visible;
    };

    private isLowerThanBound(value: number, bound: number | undefined) {
        return bound !== undefined && value < bound;
    }

    private isHigherThanBound(value: number, bound: number | undefined) {
        return bound !== undefined && value > bound;
    }

    private buildCellKey(x: number, y: number) {
        return `${x}${CELL_SEPARATOR}${y}`;
    }

    public get __testExports(): _ITextExports {
        return {
            calculateTotalUniqueTiles: this.calculateTotalUniqueTiles.bind(this),
            isValidCell: this.isValidCell.bind(this),
        };
    }
}

interface _ITextExports {
    calculateTotalUniqueTiles: InstanceType<typeof PathHelper>["calculateTotalUniqueTiles"];
    isValidCell: InstanceType<typeof PathHelper>["isValidCell"];
}
