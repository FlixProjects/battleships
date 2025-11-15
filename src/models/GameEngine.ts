import { gameManager } from "..";
import { BOARD_COLUMNS, BOARD_ROWS, ICellLoc } from "../../shared";
import { Action } from "./actions/Action";
import { DeployShipAction } from "./actions/DeployShipAction";

export class GameEngine {
    public moves: Action[] = [];

    get prime() {
        return {
            deployShip: (shipId: string) => this.primeDeployShip(shipId),
        };
    }

    get commit() {
        return {
            deployShip: (shipId: string, location: ICellLoc) => this.commitDeployShip(shipId, location),
        };
    }

    private primeDeployShip(shipId: string): ICellLoc[] {
        const availableCells: ICellLoc[] = [];

        if (gameManager.isFirstPlayer) {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, 0]);
            }
        } else {
            for (let i = 0; i < BOARD_COLUMNS; i++) {
                availableCells.push([i, BOARD_ROWS - 1]);
            }
        }

        return availableCells;
    }

    private commitDeployShip(shipId: string, location: ICellLoc) {
        this.moves.push(new DeployShipAction({ shipId, location }));
        // we need to remove that ship from the available ships
    }
}
