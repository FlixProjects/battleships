import { FERenderHullCommand } from "@shared/models/commands/FERenderHullCommand";
import { Hull } from "@shared/models/Hull";
import { Ship } from "@shared/models/Ship";
import { IGameBoard } from "@shared/types/fe-types";
import { locationToKey } from "@shared/utils/helpers";
import { queueCommand } from "../../../src/utils/game-helper";
import { FEEntity } from "./FEEntity";

export class FEShipEntity extends FEEntity<Ship> {
    protected gameBoard!: IGameBoard;

    public render(gameBoard: IGameBoard) {
        this.gameBoard = gameBoard;

        this.renderHulls();
    }

    private renderHulls() {
        this.entityProps.hulls?.forEach((hull) => {
            this.renderHull(hull);
        });
    }

    private renderHull(hull: Hull) {
        const tile = this.gameBoard.tiles[locationToKey(hull.location)];

        queueCommand(
            new FERenderHullCommand({
                parentElement: tile,
                hullId: hull.id,
            }),
        );
    }
}
