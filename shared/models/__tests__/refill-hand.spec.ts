import { ICard, IDeck, IGameStateData, IPlayer, IPlayerAction, IShip } from "../../types";
import { CardKind, Faction, MAX_HAND_SIZE } from "../../config/constants";
import { GameState } from "../GameState";

const makeCard = (id: string, deckId: string, refNo = "frigate0"): ICard => ({
    id,
    deckId,
    instanceId: `${id}-instance`,
    kind: CardKind.Ship,
    refNo,
    name: refNo,
});

const buildState = (overrides: Partial<IGameStateData>): IGameStateData => ({
    code: "TEST",
    currentRound: 0,
    players: [],
    ships: [],
    hulls: [],
    cards: [],
    decks: [],
    actions: [],
    board: {},
    winners: [],
    isOver: false,
    ...overrides,
});

const buildDeck = (id: string, playerId: string, cards: ICard[], played: ICard[] = []): IDeck => ({
    id,
    playerId,
    faction: Faction.THE_UNITED_DEFENSE_FLEET,
    cards,
    played,
});

const buildPlayer = (id: string, deck: string, hand: string[]): IPlayer => ({
    id,
    name: id,
    order: 0,
    ready: false,
    ships: [] as IShip[],
    pendingActions: [] as IPlayerAction[],
    maxCommandPoints: 2,
    commandPoints: 2,
    faction: Faction.THE_UNITED_DEFENSE_FLEET,
    hand,
    deck,
});

describe("GameState.refillPlayerHand", () => {
    it("draws cards from the deck until hand reaches maxHandSize", () => {
        const cards = ["c1", "c2", "c3", "c4", "c5"].map((id) => makeCard(id, "deck-1"));
        const deck = buildDeck("deck-1", "p1", cards);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", [])],
                cards,
                decks: [deck],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual(["c1", "c2", "c3", "c4"]);
        expect(state.decks[0].cards.map((c) => c.id)).toEqual(["c5"]);
    });

    it("draws only what is needed when hand is partially full", () => {
        const cards = ["c1", "c2", "c3"].map((id) => makeCard(id, "deck-1"));
        const deck = buildDeck("deck-1", "p1", cards);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", ["existing-1", "existing-2"])],
                cards,
                decks: [deck],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual(["existing-1", "existing-2", "c1", "c2"]);
        expect(state.decks[0].cards.map((c) => c.id)).toEqual(["c3"]);
    });

    it("is a no-op when hand is already at maxHandSize", () => {
        const cards = ["c1", "c2"].map((id) => makeCard(id, "deck-1"));
        const deck = buildDeck("deck-1", "p1", cards);
        const fullHand = ["h1", "h2", "h3", "h4"];
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", fullHand)],
                cards,
                decks: [deck],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual(fullHand);
        expect(state.decks[0].cards.map((c) => c.id)).toEqual(["c1", "c2"]);
    });

    it("draws what is available when deck has fewer cards than needed", () => {
        const cards = ["c1"].map((id) => makeCard(id, "deck-1"));
        const deck = buildDeck("deck-1", "p1", cards);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", [])],
                cards,
                decks: [deck],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual(["c1"]);
        expect(state.decks[0].cards).toEqual([]);
    });

    it("is a no-op when the deck is empty", () => {
        const deck = buildDeck("deck-1", "p1", []);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", [])],
                cards: [],
                decks: [deck],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual([]);
        expect(state.decks[0].cards).toEqual([]);
    });

    it("is a no-op when the player has no matching deck", () => {
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "missing-deck", [])],
                cards: [],
                decks: [],
            }),
        );

        state.refillPlayerHand("p1", MAX_HAND_SIZE);

        expect(state.players[0].hand).toEqual([]);
    });
});

describe("GameState.playCard", () => {
    it("removes the card from the player's hand and pushes it onto the deck's played pile", () => {
        const cards = ["c1", "c2"].map((id) => makeCard(id, "deck-1"));
        const deck = buildDeck("deck-1", "p1", []);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", ["c1", "c2"])],
                cards,
                decks: [deck],
            }),
        );

        state.playCard("p1", "c1");

        expect(state.players[0].hand).toEqual(["c2"]);
        expect(state.decks[0].played.map((c) => c.id)).toEqual(["c1"]);
    });

    it("is a no-op when the card is not in the player's hand", () => {
        const cards = [makeCard("c1", "deck-1")];
        const deck = buildDeck("deck-1", "p1", []);
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "deck-1", [])],
                cards,
                decks: [deck],
            }),
        );

        state.playCard("p1", "c1");

        expect(state.players[0].hand).toEqual([]);
        expect(state.decks[0].played).toEqual([]);
    });

    it("is a no-op when the player has no matching deck", () => {
        const cards = [makeCard("c1", "missing-deck")];
        const state = new GameState(
            buildState({
                players: [buildPlayer("p1", "missing-deck", ["c1"])],
                cards,
                decks: [],
            }),
        );

        state.playCard("p1", "c1");

        // Hand stays as-is — we don't yank a card with nowhere to put it
        expect(state.players[0].hand).toEqual(["c1"]);
    });
});

describe("GameState.refillHands", () => {
    const buildTwoPlayerState = (p1: IPlayer, p2: IPlayer) => {
        const p1Cards = Array.from({ length: 8 }, (_, i) => makeCard(`p1-c${i + 1}`, "deck-1"));
        const p2Cards = Array.from({ length: 8 }, (_, i) => makeCard(`p2-c${i + 1}`, "deck-2"));

        return new GameState(
            buildState({
                players: [p1, p2],
                cards: [...p1Cards, ...p2Cards],
                decks: [buildDeck("deck-1", "p1", p1Cards), buildDeck("deck-2", "p2", p2Cards)],
            }),
        );
    };

    it("refills each player to their own maxHandSize", () => {
        const state = buildTwoPlayerState(
            { ...buildPlayer("p1", "deck-1", []), maxHandSize: 2 },
            { ...buildPlayer("p2", "deck-2", []), maxHandSize: 6 },
        );

        state.refillHands();

        expect(state.getPlayer("p1").hand).toEqual(["p1-c1", "p1-c2"]);
        expect(state.getPlayer("p2").hand).toHaveLength(6);
    });

    it("falls back to MAX_HAND_SIZE for a player saved without a maxHandSize", () => {
        const state = buildTwoPlayerState(buildPlayer("p1", "deck-1", []), buildPlayer("p2", "deck-2", []));

        state.refillHands();

        expect(state.getPlayer("p1").hand).toHaveLength(MAX_HAND_SIZE);
        expect(state.getPlayer("p2").hand).toHaveLength(MAX_HAND_SIZE);
    });

    it("keeps a player's maxHandSize across toPlain and rehydration", () => {
        const state = buildTwoPlayerState(
            { ...buildPlayer("p1", "deck-1", []), maxHandSize: 6 },
            buildPlayer("p2", "deck-2", []),
        );

        const rehydrated = new GameState(state.toPlain());
        rehydrated.refillHands();

        expect(rehydrated.toPlain().players[0].maxHandSize).toBe(6);
        expect(rehydrated.getPlayer("p1").hand).toHaveLength(6);
    });
});
