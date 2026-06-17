import { COMPONENT_ID, TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { IBoardDimensions, ICellLoc } from "@shared/types";

const SVG_NS = "http://www.w3.org/2000/svg";

interface IProps {
    boardConfig: IBoardDimensions;
}
export class PathOverlay {
    constructor(private props: IProps) {}
    private svg?: SVGSVGElement;

    public draw(route: ICellLoc[]) {
        this.clear();
        if (route.length < 2) return;

        const parent = document.getElementById(COMPONENT_ID.GAME_BOARD_CONTAINER);
        if (!parent) return;

        this.svg = this.createSvg();
        const points = route.map(this.cellCenter);
        this.svg.appendChild(this.createPolyline(points));
        points.forEach((p, i) => {
            this.svg?.appendChild(this.createMarker(p, i === points.length - 1));
        });

        parent.appendChild(this.svg);
    }

    public clear() {
        this.svg?.remove();
        this.svg = undefined;
    }

    private cellCenter = ([col, row]: ICellLoc) => {
        const step = TILE_SIZE_PX + TILE_GAP_PX;
        return {
            x: col * step + TILE_SIZE_PX / 2,
            y: row * step + TILE_SIZE_PX / 2,
        };
    };

    private createSvg(): SVGSVGElement {
        const { rows, cols } = this.props.boardConfig;
        const width = cols * TILE_SIZE_PX + (cols - 1) * TILE_GAP_PX;
        const height = rows * TILE_SIZE_PX + (rows - 1) * TILE_GAP_PX;

        const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
        svg.setAttribute("width", `${width}`);
        svg.setAttribute("height", `${height}`);
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "50";
        return svg;
    }

    private createPolyline(points: { x: number; y: number }[]): SVGPolylineElement {
        const polyline = document.createElementNS(SVG_NS, "polyline") as SVGPolylineElement;
        polyline.setAttribute("points", points.map((p) => `${p.x},${p.y}`).join(" "));
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", "rgba(110, 231, 183, 0.9)");
        polyline.setAttribute("stroke-width", "3");
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute("stroke-linejoin", "round");
        polyline.setAttribute("stroke-dasharray", "6 4");
        return polyline;
    }

    private createMarker(point: { x: number; y: number }, isEnd: boolean): SVGCircleElement {
        const circle = document.createElementNS(SVG_NS, "circle") as SVGCircleElement;
        circle.setAttribute("cx", `${point.x}`);
        circle.setAttribute("cy", `${point.y}`);
        circle.setAttribute("r", isEnd ? "6" : "3");
        circle.setAttribute("fill", isEnd ? "rgba(110, 231, 183, 1)" : "rgba(110, 231, 183, 0.7)");
        return circle;
    }
}
