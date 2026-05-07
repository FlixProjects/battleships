import { v7 as uuidv7 } from "uuid";
import { BOARD_COLUMNS, BOARD_ROWS, CELL_SEPARATOR, FP_AUTH_TOKEN, SHIPS_CONFIG, TShipRefNo } from "../constants";
import { Faction, FACTION_CONFIG, MAX_HAND_SIZE, type TFaction } from "../factions";
import { Cell } from "../models/Cell";
import { Deck } from "../models/Deck";
import {
    Board,
    CardKind,
    ICellLoc,
    IGameState,
    IHull,
    IHullTemplate,
    IPlainCard,
    IPlainDeck,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip
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
    const player = initialiseNewPlayer({ id: playerId, name: playerName, order: 0 });
    const starting = buildPlayerStartingState(playerId, Faction.THE_UNITED_FLEET);
    applyStartingStateToPlayer(player, starting);

    const newGame: IPlainGameState = {
        code: gameCode,
        currentRound: 0,
        players: [player],
        ships: starting.ships,
        cards: starting.cards,
        decks: [starting.deck],
        board: getNewBoard(),
        initiative: playerId,
        winners: [],
        isOver: false,
        actions: [],
    };

    return newGame;
};

export interface IPlayerStartingState {
    ships: IPlainShip[];
    cards: IPlainCard[];
    deck: IPlainDeck;
    hand: string[];
}

/**
 * Single source of truth for the FK graph between a player's Ships, Cards, and Deck.
 *
 * Builds the configured ships for the faction, wraps each in a Card, shuffles the
 * deck (with the flagship pinned to the top so it is always drawn into the starting
 * hand), and draws MAX_HAND_SIZE cards into the player's hand.
 *
 * NOTE: shuffling/drawing happen here so the caller (server-side at create-game /
 * join-game) gets a fully populated state. Do not call this on the client outside
 * of local-only flows like ResetLocalGameButton.
 */
export const buildPlayerStartingState = (playerId: string, faction: TFaction): IPlayerStartingState => {
    const template = FACTION_CONFIG[faction];

    const ships: IPlainShip[] = template.flatMap((entry) =>
        Array.from({ length: entry.count }, () => getShip(entry.refNo, playerId)),
    );

    const deckId = uuidv7();
    const allCards: IPlainCard[] = ships.map((ship) => ({
        id: uuidv7(),
        deckId,
        instanceId: ship.id,
        kind: CardKind.Ship,
        refNo: ship.refNo,
    }));

    // Build a transient Deck domain object to leverage the one-time shuffle
    // and the draw mechanic — the result is then projected back to plain.
    // Deck.create encapsulates the only path that shuffles a deck.
    const deckDomain = Deck.create({
        id: deckId,
        playerId,
        faction,
        cards: allCards,
        pinnedRefNo: findFlagshipRefNo(template),
    });
    const drawn = deckDomain.draw(MAX_HAND_SIZE);

    const plainDeck: IPlainDeck = {
        id: deckId,
        playerId,
        faction,
        cards: deckDomain.cards.map((c) => c.id),
    };

    return {
        ships,
        cards: allCards,
        deck: plainDeck,
        hand: drawn.map((c) => c.id),
    };
};

const findFlagshipRefNo = (template: { refNo: TShipRefNo; count: number }[]): TShipRefNo | undefined => {
    return template.find((entry) => SHIPS_CONFIG[entry.refNo].isFlagship)?.refNo;
};

export const applyStartingStateToPlayer = (player: IPlainPlayer, starting: IPlayerStartingState): IPlainPlayer => {
    player.ships = starting.ships.map((s) => s.id);
    player.deck = starting.deck.id;
    player.hand = starting.hand;
    return player;
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
        faction: Faction.THE_UNITED_FLEET,
        hand: [],
        deck: "",
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
