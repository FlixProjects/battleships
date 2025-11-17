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
        ships: [getShip("frigate0", id), getShip("frigate0", id)], // TODO: player should choose their ships
        pendingActions: [],
    };
};

export const getShip = (refNo: string, playerId: string): IShip => {
    const base: IShip = { ...SHIPS_CONFIG[refNo], id: uuidv7(), playerId };
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
