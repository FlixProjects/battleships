import { Cell } from "../src/models/Cell";
import { BOARD_COLUMNS, BOARD_ROWS, SHIPS_CONFIG } from "./constants";
import { Board, ICellLoc, IShip, Player } from "./types/types";

export const getNewCell = (cellLoc: ICellLoc): Cell =>
    new Cell({
        loc: cellLoc,
        selectable: false,
        items: [],
        hidden: true,
        visibleTo: [],
    });

export const getNewBoard = (): Board => {
    const grid: Cell[] = [];

    for (let i = 0; i < BOARD_COLUMNS; i++) {
        for (let j = 0; j < BOARD_ROWS; j++) {
            grid.push(getNewCell([i, j]));
        }
    }
    return { grid };
};

export const initialiseNewPlayer = (id: string, name: string): Player => {
    return {
        name,
        id,
        ready: false,
        ships: [getShip("basic"), getShip("basic")],
    };
};

export const getShip = (id: string): IShip => {
    return { ...SHIPS_CONFIG[id] };
};
