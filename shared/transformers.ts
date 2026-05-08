import {
    IAppState,
    ICard,
    IDeck,
    IGameObject,
    IGameState,
    IHull,
    IPlainAppState,
    IPlainCard,
    IPlainDeck,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    IPlayer,
    IShip,
} from "./types/types";

export const transformObjectToPlain = <T extends IGameObject, K extends keyof T>(
    parent: T,
    keys: K[],
): Omit<T, K> & Record<K, string[]> => {
    let result: any = { ...parent };
    keys.forEach((key) => {
        if (parent[key] instanceof Array) {
            result = { ...result, [key]: parent[key].map((o: IGameObject) => o.id) };
        }
        // if key is undefined or not array we do not transform
    });

    return result;
};

export const transformShipToPlain = (ship: IShip): IPlainShip => {
    return transformObjectToPlain(ship, ["hulls"]);
};

export const transformShipsToPlain = (ships: IShip[]): IPlainShip[] => {
    return ships.map(transformShipToPlain);
};

export const transformPlayerToPlain = (player: IPlayer): IPlainPlayer => {
    return transformObjectToPlain(player, ["ships", "pendingActions"]);
};

export const transformPlayersToPlain = (players: IPlayer[]): IPlainPlayer[] => {
    return players.map(transformPlayerToPlain);
};

export const transformDeckToPlain = (deck: IDeck): IPlainDeck => {
    return transformObjectToPlain(deck, ["cards", "played"]);
};

export const transformDecksToPlain = (decks: IDeck[]): IPlainDeck[] => {
    return decks.map(transformDeckToPlain);
};

export const transformCardToPlain = (card: ICard): IPlainCard => {
    return {
        id: card.id,
        deckId: card.deckId,
        instanceId: card.instanceId,
        kind: card.kind,
        refNo: card.refNo,
    };
};

export const transformCardsToPlain = (cards: ICard[]): IPlainCard[] => {
    return cards.map(transformCardToPlain);
};

export const transformGameStateToPlain = (gameState: IGameState): IPlainGameState => {
    const { players, ships, hulls, cards, decks } = gameState;


    const playersPlain = transformPlayersToPlain(players);

    return {
        ...gameState,
        players: players ? playersPlain : [],
        ships: transformShipsToPlain(ships),
        hulls: hulls,
        cards: cards ? transformCardsToPlain(cards) : [],
        decks: decks ? transformDecksToPlain(decks) : [],
    };
};

export const transformAppStateToPlain = (appState: IAppState): IPlainAppState => {
    return {
        ...appState,
        gameState: transformGameStateToPlain(appState.gameState),
    };
};

export const transformPlainAppStateToDomain = (appState: Partial<IPlainAppState>): IAppState => {
    const { gameState } = appState;
    return {
        status: appState.status,
        loading: appState.loading,
        currentPlayer: appState.currentPlayer,
        ...(gameState ? { gameState: transformPlainGameStateToDomain(gameState) } : {}),
    } as IAppState;
};

export const transformPlainDeckToDomain = (deck: IPlainDeck, cards: ICard[]): IDeck => {
    const cardsById = new Map(cards.map((c) => [c.id, c]));
    // The plain deck's `cards` and `played` are ordered lists of IDs.
    // Drawn cards retain their deckId but are no longer in either list while
    // they sit in the player's hand — a filter-by-deckId would lose that
    // distinction.
    const hydrate = (ids: string[]) =>
        ids.map((id) => cardsById.get(id)).filter((c): c is ICard => c !== undefined);
    return { ...deck, cards: hydrate(deck.cards), played: hydrate(deck.played) };
};

export const transformPlainGameStateToDomain = (_gameState: IPlainGameState): IGameState => {
    const { players, ships, hulls, cards, decks, actions } = _gameState;

    const linkedShips = ships?.map((_ship): IShip => {
        const shipHulls = hulls?.filter((hull) => hull?.shipId === _ship?.id);
        const ship: IShip = {
            ..._ship,
            hulls: shipHulls ?? [],
        };
        return ship;
    });

    const linkedDecks: IDeck[] = (decks ?? []).map((d) => transformPlainDeckToDomain(d, cards ?? []));

    const linkedPlayers = players?.map((_player) => {
        const playerShips = linkedShips?.filter((ship) => ship.playerId === _player.id);
        const pendingActions = actions?.filter((action) => _player.pendingActions?.includes(action.id)) ?? [];
        const player: IPlayer = {
            ..._player,
            ships: playerShips,
            pendingActions,
        };
        return player;
    });

    const linkedGameState: IGameState = {
        ..._gameState,
        players: linkedPlayers,
        ships: linkedShips,
        cards: cards ?? [],
        decks: linkedDecks,
    };

    return linkedGameState;
};

export const transformPlainShipToDomain = (ship: IPlainShip, hulls: IHull[]) => {
    const shipHulls = hulls?.filter((hull) => hull.shipId === ship.id);
    const shipWithHulls: IShip = {
        ...ship,
        hulls: shipHulls,
    };
    return shipWithHulls;
};
