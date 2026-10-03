import { CardKind, DEFAULT_CONFIG, Faction, PLAYER_REF_NO } from "@shared/config/constants";
import { Deck } from "@shared/models/Deck";
import { IGameConfig } from "@shared/types/config-types";
import {
    IDeckTemplateEntry,
    IPlainDeck,
    IPlainGameState,
    IPlainPlayer,
    TFaction,
    TPlayerRefNo,
    TShipRefNo,
    TSupportRefNo,
} from "@shared/types/types";
import { mergician } from "mergician";
import { v7 as uuidv7 } from "uuid";
import { resolveEffectTemplate } from "../effect-helper";

interface IPlayerContextParams {
    player: IPlainPlayer;
}

interface ICardContextParams {
    deck: IPlainDeck;
}

interface ILoadPlayerFactionParams extends IPlayerContextParams {
    faction: TFaction;
}

interface ILoadFreshGameStateParams {
    code?: string;
}

interface ILoadEmptyNewPlayerParams {
    name: string;
    id?: string;
    order?: number;
    playerConfigRefNo?: TPlayerRefNo;
}

interface ILoadHandParams extends IPlayerContextParams {
    deck: Deck;
    pinnedCardId?: string;
}

interface ILoadCardParams extends ICardContextParams {
    refNo: TShipRefNo | TSupportRefNo;
    cardEntry: IDeckTemplateEntry;
}

interface ILoadShipCardParams extends ICardContextParams {
    refNo: TShipRefNo;
}

interface ILoadSupportCardParams extends ICardContextParams {
    refNo: TSupportRefNo;
}

interface ILoadDeckParams {
    player: IPlainPlayer;
    faction: TFaction;
    pinnedCardId?: string;
}

interface ILoadCardsParams {
    deck: IPlainDeck;
    player: IPlainPlayer;
}
// separate from GameStateBuild in /factories which is only for tests
export class GameStateBuilder {
    private gameState: IPlainGameState;
    private config: IGameConfig = DEFAULT_CONFIG;

    private currentPlayer: IPlainPlayer;

    constructor(existingGameState?: IPlainGameState) {
        if (existingGameState) {
            this.gameState = existingGameState;
            return;
        }
        this.loadFreshGameState();
    }

    public loadCode(code: string) {
        this.gameState.code = code;
        return this;
    }

    public overrideConfig(config: Partial<IGameConfig>) {
        this.config = mergician(this.config, config) as IGameConfig;
        return this;
    }

    public loadPlayerFaction(_params: ILoadPlayerFactionParams) {
        _params.player.faction = _params.faction;
        return {
            loadDeck: (pinnedCardId: string) =>
                this.loadDeck({ ..._params, faction: _params.player.faction, pinnedCardId }),
        };
    }

    public loadEmptyNewPlayer(_params: ILoadEmptyNewPlayerParams) {
        const params = this.loadParams(
            {
                id: uuidv7(),
                name: "UnknownPlayer",
                order: 1,
                playerConfigRefNo: PLAYER_REF_NO.default,
            },
            _params,
        );
        const { playerConfigRefNo, ...playerParams } = params;
        const newPlayer: IPlainPlayer = {
            ready: false,
            ships: [],
            pendingActions: [],
            faction: Faction.THE_UNITED_DEFENSE_FLEET, // temp default faction
            hand: [],
            deck: "",
            ...playerParams,
            ...this.config.playersConfig[playerConfigRefNo],
        };

        if (this.gameState.players.length < 2) {
            this.gameState.players.push(newPlayer);
        }

        return {
            loadFaction: (faction: TFaction) => this.loadPlayerFaction({ player: newPlayer, faction }),
        };
    }

    public setCurrentPlayer(playerId: string) {
        const player = this.gameState.players.find((p) => p.id === playerId);
        if (!player) throw new Error(`Player with id ${playerId} not found in game state`);
        this.currentPlayer = player;
        return this;
    }

    public build(override: Partial<IPlainGameState> = {}): IPlainGameState {
        return mergician(override, this.gameState) as IPlainGameState;
    }

    private loadDeck(params: ILoadDeckParams) {
        const { faction, pinnedCardId, player } = params;
        const deckId = uuidv7();
        const deckDomain = Deck.create({
            id: deckId,
            playerId: player.id,
            faction,
            cards: [],
            pinnedCardId, // TODO: we should accept multiple cards
        });
        const deck = deckDomain.toPlain();

        this.gameState.decks.push(deck);
        player.deck = deck.id;
        const loadHand = () => this.loadHand({ deck: deckDomain, player });
        const loadCards = () => this.loadCards({ deck, player });
        return {
            loadCards: () => {
                this.loadCards({ deck, player });
                return { loadHand };
            },
            loadHand: () => {
                this.loadHand({ deck: deckDomain, player });
                return { loadCards };
            },
        };
    }

    private loadCards({ deck, player }: ILoadCardsParams) {
        const deckConfig = this.config.factionConfig[player.faction].deck;
        const cards = deckConfig
            .map((c) => this.loadCard({ cardEntry: c, deck, refNo: c.refNo }))
            .filter((c) => c !== undefined);
        deck.cards = cards.map((c) => c.id);
        this.gameState.cards.push(...cards);
        return this;
    }

    private loadCard({ cardEntry, deck }: ILoadCardParams) {
        switch (cardEntry.kind) {
            case CardKind.Ship:
                return this.loadShipCard({ refNo: cardEntry.refNo, deck });
            case CardKind.Support:
                return this.loadSupportCard({ refNo: cardEntry.refNo, deck });
        }
    }

    // TODO: do we need playerId?
    private loadShipCard({ refNo, deck }: ILoadShipCardParams) {
        const shipTemplate = this.config.shipsConfig[refNo];
        const card = {
            id: uuidv7(),
            deckId: deck.id,
            instanceId: uuidv7(), // new implementation: we try to avoid pre-creation of ships
            kind: CardKind.Ship,
            refNo: shipTemplate.refNo,
            name: shipTemplate.name,
        };
        return card;
    }

    private loadSupportCard({ refNo, deck }: ILoadSupportCardParams) {
        const supportTemplate = this.config.supportsConfig[refNo];
        const card = {
            id: uuidv7(),
            deckId: deck.id,
            instanceId: uuidv7(),
            kind: CardKind.Support,
            refNo,
            name: supportTemplate.name,
            description: supportTemplate.description,
            commandPointCost: supportTemplate.commandPointCost,
            effectTemplates: supportTemplate.effectTemplates.map(resolveEffectTemplate),
            imgSrc: supportTemplate.imgSrc,
        };
        return card;
    }

    private loadHand({ deck, player }: ILoadHandParams) {
        const drawnCards = deck.draw(this.config.playersConfig[PLAYER_REF_NO.default].maxHandSize);
        player.hand = drawnCards.map((c) => c.id);
        return;
    }

    private loadParams<T>(defaults: T, _param: Partial<T>): T {
        return { ...defaults, ..._param };
    }

    private loadFreshGameState(params: ILoadFreshGameStateParams = {}) {
        this.gameState = {
            code: "",
            currentRound: 0,
            players: [],
            ships: [],
            cards: [],
            effects: [],
            decks: [],
            board: {},
            initiative: "",
            winners: [],
            isOver: false,
            actions: [],
            ...params,
        };
        return this;
    }
}
