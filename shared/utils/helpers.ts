import { CELL_SEPARATOR, FP_AUTH_TOKEN } from "@shared/constants";
import { v7 as uuidv7 } from "uuid";
import {
    BOARD_CONFIG,
    CardKind,
    CELL_CONFIG,
    CELL_NODE_REF_NO,
    Faction,
    FACTION_CONFIG,
    MAP_REF_NO,
    MAX_HAND_SIZE,
    SHIPS_CONFIG,
    SUPPORTS_CONFIG,
} from "../config/constants";
import { Cell } from "../models/Cell";
import { Deck } from "../models/Deck";
import {
    IBoard,
    ICellLoc,
    ICellNode,
    IDeckTemplateEntry,
    IGameState,
    IHull,
    IHullTemplate,
    IPlainCard,
    IPlainDeck,
    IPlainEffect,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    ISupportDeckTemplateEntry,
    TCellNodeRefNo,
    TFaction,
    TMapRefNo,
    TShipRefNo,
} from "../types/types";
import { resolveEffectTemplate } from "./effect-helper";

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

export const getCellNode = (
    cellNodeRefNo: TCellNodeRefNo,
    cellNode: Pick<ICellNode, "id" | "location">,
): ICellNode => ({
    ...CELL_CONFIG[cellNodeRefNo],
    ...cellNode,
});

export const getNewBoard = (mapRefNo?: TMapRefNo): IBoard => {
    const nodes: Record<string, ICellNode> = {};

    const boardConfig = BOARD_CONFIG[mapRefNo ?? MAP_REF_NO.default];

    for (let i = 0; i < boardConfig.columns; i++) {
        for (let j = 0; j < boardConfig.rows; j++) {
            const locKey = locationToKey([i, j]);
            nodes[locKey] = getCellNode(boardConfig.nodes[locKey]?.refNo ?? CELL_NODE_REF_NO.default, {
                id: uuidv7(),
                location: [i, j],
            });
        }
    }
    return nodes;
};

export const createNewGameState = (gameCode: string, playerId: string, playerName: string): IPlainGameState => {
    const player = initialiseNewPlayer({ id: playerId, name: playerName, order: 0 });
    const starting = buildPlayerStartingState(playerId, Faction.THE_UNITED_DEFENSE_FLEET);
    applyStartingStateToPlayer(player, starting);

    const newGame: IPlainGameState = {
        code: gameCode,
        currentRound: 0,
        players: [player],
        ships: starting.ships,
        cards: starting.cards,
        effects: starting.effects,
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
    effects: IPlainEffect[];
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
    const { deck } = FACTION_CONFIG[faction];

    const shipEntries = deck.filter((e) => e.kind === CardKind.Ship);
    const supportEntries = deck.filter((e) => e.kind === CardKind.Support);

    const ships: IPlainShip[] = shipEntries.flatMap((entry: IDeckTemplateEntry) =>
        Array.from({ length: entry.count }, () => getShip(entry.refNo as TShipRefNo, playerId)),
    );

    const deckId = uuidv7();
    const shipCards: IPlainCard[] = ships.map((ship) => ({
        id: uuidv7(),
        deckId,
        instanceId: ship.id,
        kind: CardKind.Ship,
        refNo: ship.refNo,
        name: ship.name,
    }));

    const supportCards: IPlainCard[] = supportEntries.flatMap((entry: ISupportDeckTemplateEntry) =>
        Array.from({ length: entry.count }, () => {
            const cardId = uuidv7();
            const supportConfig = SUPPORTS_CONFIG[entry.refNo];
            const effectTemplates = supportConfig.effectTemplates.map(resolveEffectTemplate);

            return {
                id: cardId,
                deckId,
                // Support cards own no entity up front — Effects are minted only
                // when the card is played — so instanceId just points at itself.
                instanceId: cardId,
                kind: CardKind.Support,
                refNo: entry.refNo,
                name: supportConfig.name,
                description: supportConfig.description,
                commandPointCost: supportConfig.commandPointCost,
                effectTemplates,
                imgSrc: supportConfig.imgSrc,
            };
        }),
    );

    const allCards: IPlainCard[] = [...shipCards, ...supportCards];

    const flagshipShip = ships.find((s) => s.isFlagship);
    const flagshipCardId = shipCards.find((c) => c.instanceId === flagshipShip?.id)?.id;

    // Build a transient Deck domain object to leverage the one-time shuffle
    // and the draw mechanic — the result is then projected back to plain.
    // Deck.create encapsulates the only path that shuffles a deck.
    const deckDomain = Deck.create({
        id: deckId,
        playerId,
        faction,
        cards: allCards,
        pinnedCardId: flagshipCardId,
    });
    const drawn = deckDomain.draw(MAX_HAND_SIZE);

    const plainDeck: IPlainDeck = {
        id: deckId,
        playerId,
        faction,
        cards: deckDomain.cards.map((c) => c.id),
        played: [],
    };

    return {
        ships,
        cards: allCards,
        // Effects are minted on play, not at game creation, so a fresh game has none.
        effects: [],
        deck: plainDeck,
        hand: drawn.map((c) => c.id),
    };
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
        faction: Faction.THE_UNITED_DEFENSE_FLEET,
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

export const reduceToZero = (value: number, toReduceBy: number) => {
    return {
        value: value > toReduceBy ? value - toReduceBy : 0,
        leftover: value > toReduceBy ? 0 : toReduceBy - value,
    };
};
