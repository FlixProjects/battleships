import { v7 as uuidv7 } from "uuid";
import { Cell } from "../../src/models/Cell";
import { BOARD_COLUMNS, BOARD_ROWS, SHIPS_CONFIG } from "../constants";
import { Board, ICellLoc, IHull, IShip, Player } from "../types/types";

export const parseCookies = (cookieStr: string) => {
    const cookies = {} as Record<string, string>;
    cookieStr
        ?.split("; ")
        .map((keyValuePair) => {
            const [key, value] = keyValuePair.split("=");
            return { key: key?.trim(), value: value?.trim() };
        })
        .forEach(({ key, value }) => {
            cookies[key] = value;
        });
    return cookies;
};

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
        ships: [getShip("frigate0"), getShip("frigate0")],
        pendingActions: [],
    };
};

export const getShip = (id: string): IShip => {
    const base = { ...SHIPS_CONFIG[id] };
    base.id = uuidv7();
    return base;
};

export const getHull = (shipId: string, hullLocation: ICellLoc): IHull => {
    return {
        id: uuidv7(),
        shipId: shipId,
        location: hullLocation,
        hits: 0,
    };
};
