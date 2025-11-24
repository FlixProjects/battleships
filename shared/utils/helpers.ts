import { v7 as uuidv7 } from "uuid";
import { BOARD_COLUMNS, BOARD_ROWS, FP_AUTH_TOKEN, SHIPS_CONFIG, TShipRefNo } from "../constants";
import { Cell } from "../models/Cell";
import { Board, ICellLoc, IHull, IHullTemplate, IShip, Player } from "../types/types";

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

export const getTokenCookie = (cookies: string[]) => {
    return cookies?.map((cookie) => cookie.split("=")).find(([key, _]) => key === FP_AUTH_TOKEN)?.[1];
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
        ships: [getShip("frigate0", id), getShip("flagship0", id), getShip("frigate0", id), getShip("frigate0", id)], // TODO: player should choose their ships
        pendingActions: [],
        maxCommandPoints: 2, // can be increased with flagship
        commandPoints: 2,
    };
};

export const getShip = (refNo: TShipRefNo, playerId: string): IShip => {
    const template = { ...SHIPS_CONFIG[refNo] };
    const base: IShip = {
        ...template,
        id: uuidv7(),
        playerId,
        remainingMovement: template.movementRange,
        remainingAttacks: template.attackCountMax,
        destroyed: false,
    };
    return base;
};

export const getShipFromPlayer = (player: Player, shipId: string) => {
    return player.ships.find((ship) => ship.id === shipId);
};

export const getHullFromLocation = (ship: IShip, loc: ICellLoc): IHull => {
    return ship.hullLocations?.find((hull) => hull.location[0] === loc[0] && hull.location[1] === loc[1]);
};

export const getHull = (shipId: string, hullTemplate: IHullTemplate, location: ICellLoc): IHull => {
    return {
        ...hullTemplate,
        id: uuidv7(),
        shipId: shipId,
        remainingArmor: hullTemplate.armor,
        remainingHealth: hullTemplate.maxHealth,
        location,
        destroyed: false,
    };
};

export const getPlayerFromShipId = (players: Player[], shipId: string) => {
    return getShipFromShipId(players, shipId).playerId;
};

export const getShipFromShipId = (players: Player[], shipId: string) => {
    return players.flatMap((p) => p.ships).find((s) => s.id === shipId);
};

export const locationToKey = (location: ICellLoc) => {
    return `${location[0]},${location[1]}`;
};

export const keyToLocation = (key: string): ICellLoc => {
    return key.split(",").map((x) => parseInt(x)) as ICellLoc;
};