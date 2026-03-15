import { v7 as uuidv7 } from "uuid";
import { BOARD_COLUMNS, BOARD_ROWS, CELL_SEPARATOR, FP_AUTH_TOKEN, SHIPS_CONFIG, TShipRefNo } from "../constants";
import { Cell } from "../models/Cell";
import {
    Board,
    ICellLoc,
    IHull,
    IHullTemplate,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    IPlayer,
    IShip,
} from "../types/types";

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

export const mergeSets = <T>(sets: Set<T>[]) => {
    const arr: T[] = [];

    sets.forEach((set) => {
        arr.push(...Array.from(set));
    });

    return new Set(arr);
};

export const generateGameCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 4 })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
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

export const createNewGameState = (gameCode: string, playerId: string, playerName: string): IPlainGameState => {
    const { shipIds, ships } = getNewShipsForPlayer(playerId);
    const player = initialiseNewPlayer({ id: playerId, name: playerName, order: 0 });
    player.ships = shipIds;

    const newGame: IPlainGameState = {
        code: gameCode,
        currentRound: 0,
        players: [player],
        ships,
        board: getNewBoard(),
        initiative: playerId,
        winners: [],
        isOver: false,
        actions: [],
    };

    return newGame;
};

export const getNewShipsForPlayer = (playerId: string) => {
    const ships = [
        getShip("frigate0", playerId),
        getShip("flagship0", playerId),
        getShip("frigate0", playerId),
        getShip("frigate0", playerId),
    ];
    return { ships, shipIds: ships.map((s) => s.id) };
};

export const initialiseNewPlayer = (_options: { id: string; name: string; order?: number }): IPlainPlayer => {
    const defaultOptions = { order: 1 };
    let options = { ...defaultOptions, ..._options };
    const { id, name, order } = options;
    return {
        name,
        id,
        order,
        ready: false,
        ships: [],
        pendingActions: [],
        maxCommandPoints: 2,
        commandPoints: 2,
    };
};

export const getShip = (refNo: TShipRefNo, playerId: string): IPlainShip => {
    const template = { ...SHIPS_CONFIG[refNo] };
    return {
        ...template,
        id: uuidv7(),
        playerId,
        hulls: [],
        remainingMovement: template.movementRange,
        remainingAttacks: template.attackCountMax,
        destroyed: false,
    };
};

export const getShipFromPlayer = (player: IPlayer, shipId: string) => {
    return player.ships.find((ship) => ship.id === shipId);
};

export const getHullFromLocation = (ship: IShip, loc: ICellLoc): IHull => {
    return ship.hulls?.find((hull) => hull.location[0] === loc[0] && hull.location[1] === loc[1]);
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

export const getPlayerFromShipId = (players: IPlayer[], shipId: string) => {
    return getShipFromShipId(players, shipId).playerId;
};

export const getShipFromShipId = (players: IPlayer[], shipId: string) => {
    return players.flatMap((p) => p.ships).find((s) => s.id === shipId);
};

export const locationToKey = (location: ICellLoc) => {
    return `${location[0]}${CELL_SEPARATOR}${location[1]}`;
};

export const keyToLocation = (key: string): ICellLoc => {
    return key.split(CELL_SEPARATOR).map((x) => parseInt(x)) as ICellLoc;
};
