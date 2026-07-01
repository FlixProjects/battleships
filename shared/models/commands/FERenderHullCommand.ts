import { COLOR, TILE_SIZE_PX } from "@shared/constants";
import { ISelectable } from "@shared/types/fe-types";
import { DeployedHullIcon } from "../../../src/components/ships/DeployedHullIcon";
import { FERenderCommand } from "./FERenderCommand";
import { ICommandExecutionParams } from "./types";

export interface IFERenderHullCommandProps {
    parentElement: ISelectable;
    rect?: { top: number; left: number };
    hullId: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export class FERenderHullCommand extends FERenderCommand {
    constructor(private props: IFERenderHullCommandProps) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { parentElement, hullId } = this.props;
        const { gsm } = params;

        const hull = gsm.gameState.getHull(hullId);
        const ship = gsm.gameState.getShip(hull.shipId);
        const playerId = ship.playerId;

        const isFirstPlayer = gsm.gameState.isFirstPlayer(playerId);

        const color = isFirstPlayer ? COLOR.TEAL : COLOR.ORANGE;

        // A ship may render smaller than its tiles (ship.renderScale). Scaling each
        // hull about its own centre would open gaps between a multi-hull ship's
        // pieces, so we also nudge every hull toward the ship's centroid by the slack
        // the scale frees up — keeping the hulls anchored together. (Translate is in
        // layout space, independent of each hull's own rotation.)
        const scale = ship.renderScale ?? 1;
        const hulls = ship.getHulls();
        const centroidCol = hulls.reduce((sum, h) => sum + h.location[0], 0) / hulls.length;
        const centroidRow = hulls.reduce((sum, h) => sum + h.location[1], 0) / hulls.length;
        const translate = {
            x: (centroidCol - hull.location[0]) * TILE_SIZE_PX * (1 - scale),
            y: (centroidRow - hull.location[1]) * TILE_SIZE_PX * (1 - scale),
        };

        // FIXME: a patch for single hull ships
        const centerInTile = hulls.length === 1;

        const hullIcon = new DeployedHullIcon({
            hullId: hull.id,
            shipId: hull.shipId,
            color,
            imgSrc: hull.imgSrc ?? "",
            playerId,
            rotation: hull.orientation,
            scale,
            translate,
            centerInTile,
            mouseEnter: this.props.onMouseEnter,
            mouseLeave: this.props.onMouseLeave,
        });

        const hullIconElement = hullIcon.build();

        parentElement.addChild(hullIcon);
        parentElement.ref.appendChild(hullIconElement);

        this.staticLayer.appendChild(parentElement.ref);
        
        hullIcon.ref.style.position = "absolute";
        hullIcon.ref.style.top = `${this.props.rect?.top}px`; // TODO: Rendering is off
        hullIcon.ref.style.left = `${this.props.rect?.left}px`;
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {}
}
