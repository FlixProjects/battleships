import { COLOR } from "@shared/constants";
import { ISelectable } from "@shared/types/fe-types";
import { DeployedHullIcon } from "../../../src/components/ships/DeployedHullIcon";
import { FERenderCommand } from "./FERenderCommand";
import { ICommandExecutionParams } from "./types";

export interface IFERenderHullCommandProps {
    parentElement: ISelectable;
    hullId: string;
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
        const invert = isFirstPlayer;
        const color = isFirstPlayer ? COLOR.TEAL : COLOR.ORANGE;

        const hullIcon = new DeployedHullIcon({
            hullId: hull.id,
            shipId: hull.shipId,
            color,
            imgSrc: hull.imgSrc ?? "",
            playerId,
            rotation: hull.orientation,
        });

        parentElement.addChild(hullIcon);
        parentElement.ref.appendChild(hullIcon.build());
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {}
}
