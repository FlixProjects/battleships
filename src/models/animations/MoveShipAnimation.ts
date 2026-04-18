import { GAME_BOARD_ID } from "@shared/constants";
import { ICellLoc } from "@shared/index";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { PivotWrapper } from "./PivotWrapper";

interface ISegment {
    pivotCell: ICellLoc;
    rotateDegrees: number;
    targetCell: ICellLoc;
}

export class MoveShipAnimation extends BaseAnimation {
    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }

    public async execute(): Promise<void> {
        const { hullMap, shipId, startingOrientation } = this.props;
        const hullLocations = Array.from(hullMap.values());
        if (hullLocations.length === 0) return;

        const gameBoard = document.getElementById(GAME_BOARD_ID) as HTMLDivElement;
        const gameBoardRect = gameBoard.getBoundingClientRect();

        const hullElements = Array.from(hullMap.keys()).map((k) =>
            gameBoard.querySelector(`[id='${k}']`),
        ) as HTMLElement[];
        const ship = this.animationLayer.wrapAndCopyToLayer(this.id, hullElements, shipId);

        const startCenter = centerOfCells(hullLocations.map((h) => h.oldLoc));
        const endCenter = centerOfCells(hullLocations.map((h) => h.newLoc));
        const segments = this.buildSegments(startCenter, endCenter, startingOrientation);

        let shipCell = startCenter;

        for (const segment of segments) {
            const pivot = new PivotWrapper({
                pivotCell: segment.pivotCell,
                ship,
                shipCell,
                layer: this.animationLayer.layer,
                gameBoardRect,
                duration: this.duration,
            });
            await pivot.rotate(segment.rotateDegrees);
            await pivot.moveBy(delta(shipCell, segment.targetCell));
            shipCell = pivot.release().cell;
        }

        this.animationLayer.destroyCopiedElements(this.id);
    }

    private buildSegments(start: ICellLoc, end: ICellLoc, startingOrientation: number): ISegment[] {
        const segments: ISegment[] = [];
        const shipIsVertical = startingOrientation % 180 === 0;
        const turn = turningPoint(start, end, shipIsVertical);

        const rot1 = rotationToFace(start, turn, startingOrientation);
        segments.push({ pivotCell: start, rotateDegrees: rot1, targetCell: turn });

        if (!sameCell(turn, end)) {
            const rot2 = rotationToFace(turn, end, startingOrientation + rot1);
            segments.push({ pivotCell: turn, rotateDegrees: rot2, targetCell: end });
        }

        return segments.filter((s) => s.rotateDegrees !== 0 || !sameCell(s.pivotCell, s.targetCell));
    }
}

function centerOfCells(cells: ICellLoc[]): ICellLoc {
    const sumX = cells.reduce((a, c) => a + c[0], 0);
    const sumY = cells.reduce((a, c) => a + c[1], 0);
    return [sumX / cells.length, sumY / cells.length];
}

function turningPoint(start: ICellLoc, end: ICellLoc, isVertical: boolean): ICellLoc {
    return isVertical ? [start[0], end[1]] : [end[0], start[1]];
}

function rotationToFace(from: ICellLoc, to: ICellLoc, currentOrientation: number): number {
    if (sameCell(from, to)) return 0;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const target = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    let rotation = target - currentOrientation;
    // Normalize rotation to the range [-180, 180]
    if (rotation > 180) rotation -= 360;
    else if (rotation < -180) rotation += 360;
    return rotation;
}

function delta(from: ICellLoc, to: ICellLoc): ICellLoc {
    return [to[0] - from[0], to[1] - from[1]];
}

function sameCell(a: ICellLoc, b: ICellLoc): boolean {
    return a[0] === b[0] && a[1] === b[1];
}
