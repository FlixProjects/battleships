import { BOARD_COLUMNS, SHIPS_CONFIG } from "./constants";
import { Board, IShip, Player } from "./types/types";

export const getNewBoard = (): Board => ({
    grid: Array(BOARD_COLUMNS).fill([]),
});

export const initialiseNewPlayer = (id: string, name: string): Player => {
    return {
        name,
        id,
        ready: false,
        board: getNewBoard(),
        ships: [getShip("basic"), getShip("basic")],
    };
};

export const getShip = (id: string): IShip => {
    return { ...SHIPS_CONFIG[id] };
};
