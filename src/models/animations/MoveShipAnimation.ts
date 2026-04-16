import { CELL_SEPARATOR, GAME_BOARD_ID } from "@shared/constants";
import { ICellLoc, INewOldHullLocMap } from "@shared/index";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { MoveAnimation } from "./MoveAnimation";
import { RotateAnimation } from "./RotateAnimation";

export class MoveShipAnimation extends BaseAnimation {
    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }

    public async execute(): Promise<void> {
        const { hullMap, shipId } = this.props;

        const gameBoard = document.getElementById(GAME_BOARD_ID) as HTMLDivElement;
        const _shipElements = Array.from(hullMap.keys()).map((k) =>
            gameBoard.querySelector(`[id='${k}']`),
        ) as HTMLElement[];

        const shipElement = this.animationLayer.wrapAndCopyToLayer(this.id, _shipElements, shipId);

        const hullLocations = Array.from(hullMap.values());
        if (hullLocations.length === 0) return;

        const oldLocs = hullLocations.map((h) => h.oldLoc);
        const newLocs = hullLocations.map((h) => h.newLoc);

        const startCenter = this.calculateCenter(oldLocs);
        const endCenter = this.calculateCenter(newLocs);

        // Single hull: L-path (Y then X) without rotation
        if (hullLocations.length < 2) {
            const mid: ICellLoc = [startCenter[0], endCenter[1]];
            await this.moveIfNeeded(shipElement, startCenter, mid);
            await this.moveIfNeeded(shipElement, mid, endCenter);
            this.animationLayer.destroyCopiedElements(this.id);
            return;
        }

        const isVertical = this.isShipVertical(oldLocs);
        const turningPoint = this.getTurningPoint(startCenter, endCenter, isVertical);
        const rotationDegrees = this.calculateRotation(hullLocations);

        // Set transform-origin to turning point tile center for correct rotation pivot
        if (rotationDegrees !== 0) {
            this.setTransformOriginToTile(shipElement, turningPoint, gameBoard);
        }

        if (isVertical) {
            // Step 1: Move along Y-axis to turning point
            await this.moveIfNeeded(shipElement, startCenter, [startCenter[0], turningPoint[1]]);
            // Step 2: Rotate at turning point
            await this.rotateIfNeeded(shipId, rotationDegrees);
            // Step 3: Move along X-axis to final position
            await this.moveIfNeeded(shipElement, [startCenter[0], turningPoint[1]], endCenter);
        } else {
            // Step 1: Move along X-axis to turning point
            await this.moveIfNeeded(shipElement, startCenter, [turningPoint[0], startCenter[1]]);
            // Step 2: Rotate at turning point
            await this.rotateIfNeeded(shipId, rotationDegrees);
            // Step 3: Move along Y-axis to final position
            await this.moveIfNeeded(shipElement, [turningPoint[0], startCenter[1]], endCenter);
        }

        this.animationLayer.destroyCopiedElements(this.id);
    }

    private async moveIfNeeded(element: HTMLElement, from: ICellLoc, to: ICellLoc): Promise<void> {
        if (from[0] === to[0] && from[1] === to[1]) return;
        const moveAnim = new MoveAnimation({
            element,
            fromCell: from,
            toCell: to,
        });
        await moveAnim.execute();
    }

    private async rotateIfNeeded(elementId: string, degrees: number): Promise<void> {
        if (degrees === 0) return;
        const rotateAnim = new RotateAnimation({
            elementId,
            degrees,
        });
        await rotateAnim.execute();
    }

    private calculateCenter(locations: ICellLoc[]): ICellLoc {
        const sumX = locations.reduce((sum, loc) => sum + loc[0], 0);
        const sumY = locations.reduce((sum, loc) => sum + loc[1], 0);
        return [sumX / locations.length, sumY / locations.length];
    }

    private isShipVertical(locations: ICellLoc[]): boolean {
        if (locations.length < 2) return true;
        // Ship is vertical if hulls share the same column
        return locations[0][0] === locations[1][0];
    }

    private getTurningPoint(start: ICellLoc, end: ICellLoc, isVertical: boolean): ICellLoc {
        if (isVertical) {
            // Move along ship's axis (Y) first: turning point keeps start X, takes end Y
            return [start[0], end[1]];
        }
        // Move along ship's axis (X) first: turning point takes end X, keeps start Y
        return [end[0], start[1]];
    }

    private calculateRotation(hullLocations: INewOldHullLocMap[]): number {
        if (hullLocations.length < 2) return 0;

        const frontIndex = this.getFrontHullIndex(hullLocations);
        const oldLocs = hullLocations.map((h) => h.oldLoc);
        const newLocs = hullLocations.map((h) => h.newLoc);

        const oldDir = this.getShipDirection(oldLocs, frontIndex);
        const newDir = this.getShipDirection(newLocs, frontIndex);

        // If directions are the same, no rotation needed
        if (oldDir[0] === newDir[0] && oldDir[1] === newDir[1]) return 0;

        // Convert direction vectors to angles using game convention:
        // up [0,-1] → 0°, right [1,0] → 90°, down [0,1] → 180°, left [-1,0] → 270°
        const oldAngle = Math.atan2(oldDir[0], -oldDir[1]) * (180 / Math.PI);
        const newAngle = Math.atan2(newDir[0], -newDir[1]) * (180 / Math.PI);

        let rotation = newAngle - oldAngle;
        // Normalize to [-180, 180] for shortest rotation path
        while (rotation > 180) rotation -= 360;
        while (rotation <= -180) rotation += 360;

        return rotation;
    }

    private getFrontHullIndex(hullLocations: INewOldHullLocMap[]): number {
        // For a 2-hull ship: back hull's new location = front hull's old location
        const [a, b] = hullLocations;
        if (a.newLoc[0] === b.oldLoc[0] && a.newLoc[1] === b.oldLoc[1]) {
            return 1; // B is front
        }
        return 0; // A is front
    }

    private getShipDirection(locations: ICellLoc[], frontIndex: number): ICellLoc {
        const backIndex = 1 - frontIndex;
        return [
            locations[frontIndex][0] - locations[backIndex][0],
            locations[frontIndex][1] - locations[backIndex][1],
        ];
    }

    private setTransformOriginToTile(wrapper: HTMLElement, turningPoint: ICellLoc, gameBoard: HTMLElement): void {
        const tileId = `${turningPoint[0]}${CELL_SEPARATOR}${turningPoint[1]}`;
        const tile = gameBoard.querySelector(`[id='${tileId}']`) as HTMLElement;
        if (!tile) return;

        const tileRect = tile.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();

        const originX = tileRect.left + tileRect.width / 2 - wrapperRect.left;
        const originY = tileRect.top + tileRect.height / 2 - wrapperRect.top;

        wrapper.style.transformOrigin = `${originX}px ${originY}px`;
    }
}
