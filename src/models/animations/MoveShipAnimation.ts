import { COMPONENT_ID } from "@shared/constants";
import { ICellLoc, INewOldHullLocMap } from "@shared/types";
import { SegmentBuilder } from "@shared/utils/segment-builder";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { PivotWrapper } from "./PivotWrapper";

export class MoveShipAnimation extends BaseAnimation {
    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }

    public async execute(): Promise<void> {
        const { hullMap, shipId, startingOrientation, route } = this.props;
        const hullLocations = Array.from(hullMap.values());
        if (hullLocations.length === 0) return;

        const gameBoard = document.getElementById(COMPONENT_ID.GAME_BOARD_STATIC_LAYER) as HTMLDivElement;
        const gameBoardRect = gameBoard.getBoundingClientRect();

        const hullElements = Array.from(hullMap.keys()).map((k) =>
            gameBoard.querySelector(`[id='${k}']`),
        ) as HTMLElement[];
        const ship = this.animationLayer.wrapAndCopyToLayer(this.id, hullElements, shipId);

        const segmentBuilder = new SegmentBuilder();
        const centers = this.computeCenters(hullLocations, route);

        let shipCell = centers[0];
        let orientation = startingOrientation;

        for (let i = 1; i < centers.length; i++) {
            const segments = segmentBuilder.buildSegments(shipCell, centers[i], orientation);
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
                await pivot.moveBy(segmentBuilder.delta(shipCell, segment.targetCell));
                shipCell = pivot.release().cell;
                orientation += segment.rotateDegrees;
            }
        }

        this.animationLayer.destroyCopiedElements(this.id);
    }

    private computeCenters(hullLocations: INewOldHullLocMap[], route?: ICellLoc[]): ICellLoc[] {
        const segmentBuilder = new SegmentBuilder();
        const initialCenter = segmentBuilder.centerOfCells(hullLocations.map((h) => h.oldLoc));
        const finalCenter = segmentBuilder.centerOfCells(hullLocations.map((h) => h.newLoc));

        if (!route || route.length < 2) {
            return [initialCenter, finalCenter];
        }

        if (hullLocations.length === 1) {
            return route.slice();
        }

        const centers: ICellLoc[] = [initialCenter];
        for (let i = 1; i < route.length; i++) {
            const front = route[i];
            const back = route[i - 1];
            centers.push([(front[0] + back[0]) / 2, (front[1] + back[1]) / 2]);
        }
        return centers;
    }
}
