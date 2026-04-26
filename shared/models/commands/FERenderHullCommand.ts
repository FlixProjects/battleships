import { COLOR } from "@shared/constants";
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

        const hullIcon = new DeployedHullIcon({
            hullId: hull.id,
            shipId: hull.shipId,
            color,
            imgSrc: hull.imgSrc ?? "",
            playerId,
            rotation: hull.orientation,
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
