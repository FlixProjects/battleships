import { BOARD_COLUMNS } from "./constants";
import { Board } from "./types/types";

export const getNewBoard = (): Board => ({
    grid: Array(BOARD_COLUMNS).fill([]),
});
