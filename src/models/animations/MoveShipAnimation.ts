import { GAME_BOARD_ID, TILE_SIZE_PX } from "@shared/constants";
import { ICellLoc } from "@shared/index";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { MoveAnimation } from "./MoveAnimation";
import { RotateAnimation } from "./RotateAnimation";

export class MoveShipAnimation extends BaseAnimation {
    private currentOrientation: number = 0;
    private currentCenter: ICellLoc = [0, 0];
    private targetCenter: ICellLoc = [0, 0];
    private shipElement?: HTMLElement;
    private gameBoard?: HTMLDivElement;
    private boundingRect?: DOMRect;

    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }

    public async execute(): Promise<void> {
        const { hullMap, shipId, startingOrientation } = this.props;

        this.currentOrientation = startingOrientation;

        const gameBoard = document.getElementById(GAME_BOARD_ID) as HTMLDivElement;
        this.gameBoard = gameBoard;
        this.boundingRect = gameBoard.getBoundingClientRect();

        const _shipElements = Array.from(hullMap.keys()).map((k) =>
            gameBoard.querySelector(`[id='${k}']`),
        ) as HTMLElement[];

        const shipElement = this.animationLayer.wrapAndCopyToLayer(this.id, _shipElements, shipId);
        this.shipElement = shipElement;

        const hullLocations = Array.from(hullMap.values());
        if (hullLocations.length === 0) return;

        const oldLocs = hullLocations.map((h) => h.oldLoc);
        const newLocs = hullLocations.map((h) => h.newLoc);

        const startCenter = this.calculateCenter(oldLocs);
        this.currentCenter = startCenter;

        const endCenter = this.calculateCenter(newLocs);

        const isVertical = this.isShipVertical();

        const turningPoint = this.getTurningPoint(startCenter, endCenter, isVertical);
        this.targetCenter = turningPoint;

        // Set transform-origin to turning point tile center for correct rotation pivot
        this.setTransformOriginToTile(this.currentCenter);
        await this.rotateIfNeeded(this.calculateRotation(this.currentCenter, this.targetCenter));

        this.setTransformOriginToTile(turningPoint); // before move, the transform origin set by turning point is correct
        await this.moveIfNeeded(startCenter, this.targetCenter);

        if (!this.isSameLocation(turningPoint, endCenter)) {
            this.targetCenter = endCenter;
            await this.rotateIfNeeded(this.calculateRotation(this.currentCenter, this.targetCenter));
            await this.moveIfNeeded([startCenter[0], turningPoint[1]], endCenter);
        }

        this.animationLayer.destroyCopiedElements(this.id);
    }

    private isSameLocation(loc1: ICellLoc, loc2: ICellLoc): boolean {
        return loc1[0] === loc2[0] && loc1[1] === loc2[1];
    }

    private async moveIfNeeded(from: ICellLoc, to: ICellLoc): Promise<void> {
        if (this.isSameLocation(from, to) || !this.shipElement) return;
        const moveAnim = new MoveAnimation({
            element: this.shipElement!,
            fromCell: from,
            toCell: to,
        });
        await moveAnim.execute();
        this.currentCenter = to;
    }

    private async rotateIfNeeded(degrees: number): Promise<void> {
        if (degrees === 0 || !this.shipElement) return;

        const rotateAnim = new RotateAnimation({
            element: this.shipElement,
            degrees,
        });
        await rotateAnim.execute();
        this.currentOrientation = (this.currentOrientation + degrees) % 360;
    }

    private calculateCenter(locations: ICellLoc[]): ICellLoc {
        const sumX = locations.reduce((sum, loc) => sum + loc[0], 0);
        const sumY = locations.reduce((sum, loc) => sum + loc[1], 0);
        return [sumX / locations.length, sumY / locations.length];
    }

    private isShipVertical(): boolean {
        return this.currentOrientation % 180 === 0;
    }

    private getTurningPoint(start: ICellLoc, end: ICellLoc, isVertical: boolean): ICellLoc {
        if (isVertical) {
            // Move along ship's axis (Y) first: turning point keeps start X, takes end Y
            return [start[0], end[1]];
        }
        // Move along ship's axis (X) first: turning point takes end X, keeps start Y
        return [end[0], start[1]];
    }

    private calculateRotation(frontHullTarget: ICellLoc, currentFrontHullLoc: ICellLoc): number {
        const newLocs = frontHullTarget;
        const newDir = this.getShipDirection(newLocs, currentFrontHullLoc);

        const oldAngle = this.currentOrientation;

        const newAngle = Math.atan2(newDir[1], newDir[0]) * (180 / Math.PI) + 90;

        let rotation = newAngle - oldAngle;
        // Normalize to [-180, 180] for shortest rotation path
        // while (rotation > 180) rotation/ -= 360;
        // while (rotation <= -180) rotation += 360;

        return rotation;
    }

    private getShipDirection(origin: ICellLoc, target: ICellLoc) {
        console.log("Calculating direction from", origin, "to", target);
        const deltaX = target[0] - origin[0];
        const deltaY = target[1] - origin[1];

        return [deltaX, deltaY];
    }

    private setTransformOriginToTile(turningPoint: ICellLoc): void {
        if (!this.shipElement || !this.gameBoard) return;

        const { left, top, width, height } = this.boundingRect ?? { left: 0, top: 0, width: 0, height: 0 };

        const tileRect = {
            left: left + TILE_SIZE_PX * turningPoint[0],
            top: top + TILE_SIZE_PX * turningPoint[1],
            width: TILE_SIZE_PX,
            height: TILE_SIZE_PX,
        };

        const wrapperRect = this.shipElement.getBoundingClientRect();

        const originX = tileRect.left + tileRect.width / 2 - wrapperRect.left;
        const originY = tileRect.top + tileRect.height / 2 - wrapperRect.top;

        this.shipElement.style.transformOrigin = `${originX}px ${originY}px`;
    }
}
