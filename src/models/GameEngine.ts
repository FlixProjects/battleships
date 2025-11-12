import { gameManager } from "..";
import { BOARD_COLUMNS, BOARD_ROWS, ICellLoc } from "../../shared";
import { Action } from "./Action";

export class GameEngine {
    public moves: Action[] = [];

    prime() {
        return {
            deployShip: (shipId: string) => this.primeDeployShip(shipId),
        };
    }

    primeDeployShip(shipId: string): ICellLoc[] {
        const availableCells: ICellLoc[] = [];

        if (gameManager.isFirstPlayer()) {
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
}
