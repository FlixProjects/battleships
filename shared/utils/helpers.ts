import { CELL_SEPARATOR, FP_AUTH_TOKEN } from "@shared/constants";
import { v7 as uuidv7 } from "uuid";
import { Cell } from "../models/Cell";
import { ICellLoc, IGameState, IHull, IHullTemplate } from "../types/types";

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
        hidden: true,
        visibleTo: [],
    });

export const getHull = (options: {
    shipId: string;
    hullTemplate: IHullTemplate;
    location: ICellLoc;
    isFirstPlayer: boolean;
}): IHull => {
    const { shipId, hullTemplate, location, isFirstPlayer } = options;

    return {
        ...hullTemplate,
        id: uuidv7(),
        shipId: shipId,
        remainingArmor: hullTemplate.armor,
        remainingHealth: hullTemplate.maxHealth,
        location,
        destroyed: false,
        orientation: isFirstPlayer ? 180 : 0,
    };
};

export const locationToKey = (location: ICellLoc) => {
    return `${location[0]}${CELL_SEPARATOR}${location[1]}`;
};

export const keyToLocation = (key: string): ICellLoc => {
    return key.split(CELL_SEPARATOR).map((x) => parseInt(x)) as ICellLoc;
};

export const getOccupiedLocations = (gameState: IGameState) => {
    const occuipiedLocations: ICellLoc[] = gameState.hulls?.filter((h) => !h.destroyed).map((h) => h.location) ?? [];
    return occuipiedLocations;
};

export const reduceToZero = (value: number, toReduceBy: number) => {
    return {
        value: value > toReduceBy ? value - toReduceBy : 0,
        leftover: value > toReduceBy ? 0 : toReduceBy - value,
    };
};
