import { TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { ICellLoc } from "@shared/index";
import { MoveAnimation } from "./MoveAnimation";
import { RotateAnimation } from "./RotateAnimation";

interface IPivotWrapperParams {
    pivotCell: ICellLoc;
    ship: HTMLElement;
    shipCell: ICellLoc;
    layer: HTMLElement;
    gameBoardRect: DOMRect;
    duration?: number;
}

interface IReleaseResult {
    cell: ICellLoc;
    rotationApplied: number;
}

/**
 * A transient anchor that pivots a ship sprite around a fixed board cell.
 *
 * A zero-size wrapper div is placed at the pivot cell's screen center with
 * transform-origin at (0, 0); the ship is reparented into it (position
 * offset preserved). Rotating or translating the wrapper moves the ship
 * around that pivot without any post-transform bounding-rect math.
 *
 * Contract: call rotate() at most once, then moveBy() at most once, then
 * release(). release() reparents the ship back to the layer with its final
 * position and cumulative rotation baked into its inline styles, and returns
 * the ship's new cell and the rotation applied this segment.
 */
export class PivotWrapper {
    private readonly wrapper: HTMLElement;
    private readonly ship: HTMLElement;
    private readonly pivotCell: ICellLoc;
    private readonly shipStartCell: ICellLoc;
    private readonly layer: HTMLElement;
    private readonly gameBoardRect: DOMRect;
    private readonly duration?: number;
    private readonly shipTransformBefore: string;

    private rotationDeg = 0;
    private translationCells: ICellLoc = [0, 0];

    constructor(params: IPivotWrapperParams) {
        this.ship = params.ship;
        this.pivotCell = params.pivotCell;
        this.shipStartCell = params.shipCell;
        this.layer = params.layer;
        this.gameBoardRect = params.gameBoardRect;
        this.duration = params.duration;
        this.shipTransformBefore = this.ship.style.transform || "";
        this.wrapper = this.mountWrapperAtPivot();
        this.reparentShipIntoWrapper();
    }

    public async rotate(degrees: number): Promise<void> {
        if (degrees === 0) return;
        this.rotationDeg += degrees;
        await new RotateAnimation({
            element: this.wrapper,
            degrees,
            duration: this.duration,
        }).execute();
    }

    public async moveBy(deltaCells: ICellLoc): Promise<void> {
        const [dx, dy] = deltaCells;
        if (dx === 0 && dy === 0) return;
        this.translationCells = [this.translationCells[0] + dx, this.translationCells[1] + dy];
        await new MoveAnimation({
            element: this.wrapper,
            fromCell: [0, 0],
            toCell: [dx, dy],
            duration: this.duration,
        }).execute();
    }

    public release(): IReleaseResult {
        const finalCell = this.computeFinalShipCell();
        this.reparentShipToLayer(finalCell);
        this.wrapper.remove();
        return { cell: finalCell, rotationApplied: this.rotationDeg };
    }

    private mountWrapperAtPivot(): HTMLElement {
        const wrapper = document.createElement("div");
        const pivotPx = this.cellToLayerPx(this.pivotCell);
        wrapper.style.position = "absolute";
        wrapper.style.left = `${pivotPx.x}px`;
        wrapper.style.top = `${pivotPx.y}px`;
        wrapper.style.width = "0";
        wrapper.style.height = "0";
        wrapper.style.transformOrigin = "0 0";
        this.layer.appendChild(wrapper);
        return wrapper;
    }

    private reparentShipIntoWrapper(): void {
        const pivotPx = this.cellToLayerPx(this.pivotCell);
        const shipPx = this.cellToLayerPx(this.shipStartCell);
        const { offsetWidth: w, offsetHeight: h } = this.ship;

        this.wrapper.appendChild(this.ship);
        this.ship.style.position = "absolute";
        this.ship.style.left = `${shipPx.x - pivotPx.x - w / 2}px`;
        this.ship.style.top = `${shipPx.y - pivotPx.y - h / 2}px`;
        this.ship.style.transformOrigin = "50% 50%";
    }

    private reparentShipToLayer(finalCell: ICellLoc): void {
        const finalPx = this.cellToLayerPx(finalCell);
        const { offsetWidth: w, offsetHeight: h } = this.ship;

        this.layer.appendChild(this.ship);
        this.ship.style.left = `${finalPx.x - w / 2}px`;
        this.ship.style.top = `${finalPx.y - h / 2}px`;
        this.ship.style.transform = this.composeBakedTransform();
    }

    private composeBakedTransform(): string {
        if (this.rotationDeg === 0) return this.shipTransformBefore;
        const baked = `rotate(${this.rotationDeg}deg)`;
        return this.shipTransformBefore ? `${baked} ${this.shipTransformBefore}` : baked;
    }

    private computeFinalShipCell(): ICellLoc {
        const offset: ICellLoc = [
            this.shipStartCell[0] - this.pivotCell[0],
            this.shipStartCell[1] - this.pivotCell[1],
        ];
        const rotated = rotateVector(offset, this.rotationDeg);
        return [
            this.pivotCell[0] + rotated[0] + this.translationCells[0],
            this.pivotCell[1] + rotated[1] + this.translationCells[1],
        ];
    }

    private cellToLayerPx(cell: ICellLoc): { x: number; y: number } {
        const layerRect = this.layer.getBoundingClientRect();
        const stride = TILE_SIZE_PX + TILE_GAP_PX;
        const boardCenterX = cell[0] * stride + TILE_SIZE_PX / 2;
        const boardCenterY = cell[1] * stride + TILE_SIZE_PX / 2;
        return {
            x: this.gameBoardRect.left + boardCenterX - layerRect.left,
            y: this.gameBoardRect.top + boardCenterY - layerRect.top,
        };
    }
}

function rotateVector(v: ICellLoc, degrees: number): ICellLoc {
    if (degrees % 360 === 0) return [v[0], v[1]];
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [snap(v[0] * cos - v[1] * sin), snap(v[0] * sin + v[1] * cos)];
}

function snap(n: number): number {
    return Math.abs(n) < 1e-9 ? 0 : n;
}
