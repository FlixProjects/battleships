import { COMPONENT_ID } from "@shared/constants";
import { SegmentBuilder } from "@shared/utils/segment-builder";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { PivotWrapper } from "./PivotWrapper";

export class MoveShipAnimation extends BaseAnimation {
    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }

    public async execute(): Promise<void> {
        const { hullMap, shipId, startingOrientation } = this.props;
        const hullLocations = Array.from(hullMap.values());
        if (hullLocations.length === 0) return;

        const gameBoard = document.getElementById(COMPONENT_ID.GAME_BOARD_STATIC_LAYER) as HTMLDivElement;
        const gameBoardRect = gameBoard.getBoundingClientRect();

        const hullElements = Array.from(hullMap.keys()).map((k) =>
            gameBoard.querySelector(`[id='${k}']`),
        ) as HTMLElement[];
        const ship = this.animationLayer.wrapAndCopyToLayer(this.id, hullElements, shipId);

        const segmentBuilder = new SegmentBuilder();

        const startCenter = segmentBuilder.centerOfCells(hullLocations.map((h) => h.oldLoc));
        const endCenter = segmentBuilder.centerOfCells(hullLocations.map((h) => h.newLoc));
        const segments = segmentBuilder.buildSegments(startCenter, endCenter, startingOrientation);

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
            await pivot.moveBy(segmentBuilder.delta(shipCell, segment.targetCell));
            shipCell = pivot.release().cell;
        }

        this.animationLayer.destroyCopiedElements(this.id);
    }
}
