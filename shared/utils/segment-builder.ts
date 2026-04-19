import { ICellLoc } from "@shared/types/types";

interface ISegment {
    pivotCell: ICellLoc;
    rotateDegrees: number;
    targetCell: ICellLoc;
}

export class SegmentBuilder {
    public buildSegments(start: ICellLoc, end: ICellLoc, startingOrientation: number): ISegment[] {
        const segments: ISegment[] = [];
        const shipIsVertical = startingOrientation % 180 === 0;
        const turn = this.turningPoint(start, end, shipIsVertical);

        const rot1 = this.rotationToFace(start, turn, startingOrientation);
        segments.push({ pivotCell: start, rotateDegrees: rot1, targetCell: turn });

        if (!this.sameCell(turn, end)) {
            const rot2 = this.rotationToFace(turn, end, startingOrientation + rot1);
            segments.push({ pivotCell: turn, rotateDegrees: rot2, targetCell: end });
        }

        return segments.filter((s) => s.rotateDegrees !== 0 || !this.sameCell(s.pivotCell, s.targetCell));
    }

    public centerOfCells(cells: ICellLoc[]): ICellLoc {
        const sumX = cells.reduce((a, c) => a + c[0], 0);
        const sumY = cells.reduce((a, c) => a + c[1], 0);
        return [sumX / cells.length, sumY / cells.length];
    }
    
    public turningPoint(start: ICellLoc, end: ICellLoc, isVertical: boolean): ICellLoc {
        return isVertical ? [start[0], end[1]] : [end[0], start[1]];
    }
    
    public rotationToFace(from: ICellLoc, to: ICellLoc, currentOrientation: number): number {
        if (this.sameCell(from, to)) return 0;
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const target = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        let rotation = target - currentOrientation;
        // Normalize rotation to the range [-180, 180]
        if (rotation > 180) rotation -= 360;
        else if (rotation < -180) rotation += 360;
        return rotation;
    }
    
    public delta(from: ICellLoc, to: ICellLoc): ICellLoc {
        return [to[0] - from[0], to[1] - from[1]];
    }
    
    public sameCell(a: ICellLoc, b: ICellLoc): boolean {
        return a[0] === b[0] && a[1] === b[1];
    }
    
}