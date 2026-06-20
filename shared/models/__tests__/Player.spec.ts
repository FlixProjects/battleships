import { ICard, IPlayer, IPlayerAction, IShip } from "../../types";
import { Card, ICardPlaySink } from "../Card";
import { Faction, CardKind } from "../../config/constants";
import { Player } from "../Player";

const buildPlayer = (overrides: Partial<IPlayer> = {}): IPlayer => ({
    id: "p1",
    name: "p1",
    order: 0,
    ready: false,
    ships: [] as IShip[],
    pendingActions: [] as IPlayerAction[],
    maxCommandPoints: 2,
    commandPoints: 2,
    faction: Faction.THE_UNITED_DEFENSE_FLEET,
    hand: [],
    deck: "deck-1",
    ...overrides,
});

const buildCard = (id: string): ICard => ({
    id,
    deckId: "deck-1",
    instanceId: `${id}-instance`,
    kind: CardKind.Ship,
    refNo: "frigate0",
    name: "Frigate",
});

const makeSink = (): ICardPlaySink & { received: Card[] } => {
    const received: Card[] = [];
    return {
        received,
        addToPlayed(card: Card) {
            received.push(card);
        },
    };
};

describe("Player.playCard", () => {
    it("removes the card from the hand and triggers card.onPlay", () => {
        const player = new Player(buildPlayer({ hand: ["c1", "c2"] }));
        const card = new Card(buildCard("c1"));
        const sink = makeSink();
        card.bindDeck(sink);

        player.playCard(card);

        expect(player.hand).toEqual(["c2"]);
        expect(sink.received).toHaveLength(1);
        expect(sink.received[0]).toBe(card);
    });

    it("is a no-op when the card is not in the hand", () => {
        const player = new Player(buildPlayer({ hand: ["c2"] }));
        const card = new Card(buildCard("c1"));
        const sink = makeSink();
        card.bindDeck(sink);

        player.playCard(card);

        expect(player.hand).toEqual(["c2"]);
        expect(sink.received).toEqual([]);
    });
});
