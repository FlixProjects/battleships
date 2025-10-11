import { Board } from "./types";

export const getNewBoard = (): Board => ({
    playerId: "",
    grid: [[], [], [], [], [], []],
});
