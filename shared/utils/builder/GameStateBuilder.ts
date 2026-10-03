import { DEFAULT_CONFIG, Faction, PLAYER_REF_NO } from "@shared/config/constants";
import { IGameConfig } from "@shared/types/config-types";
import { IFactionConfig, IPlainGameState, IPlainPlayer, TFaction, TPlayerRefNo } from "@shared/types/types";
import { mergician } from "mergician";
import { v7 as uuidv7 } from "uuid";

interface ILoadPlayerFactionParams {
    playerId: string;
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

// separate from GameStateBuild in /factories which is only for tests
export class GameStateBuilder {
    private gameState: IPlainGameState;

    private config: IGameConfig = DEFAULT_CONFIG;

    constructor(existingGameState?: IPlainGameState) {
        if (existingGameState) {
            this.gameState = existingGameState;
        }
    }

    public loadCode(code: string) {
        this.gameState.code = code;
    }

    public loadMap() {}

    public loadPlayerFaction(_params: ILoadPlayerFactionParams, overrideFaction: Partial<IFactionConfig> = {}) {
        return this;
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
        return this;
    }

    public build(override: Partial<IPlainGameState> = {}): IPlainGameState {
        return mergician(override, this.gameState) as IPlainGameState;
    }
    private loadShipCard(refNo: TShipRefNo, deckId: string) {
        const ship = this.config.shipsConfig[refNo];
        this.gameState.cards.push({
            id: uuidv7(),
            deckId,
            instanceId: uuidv7(), // new implementation: we try to avoid pre-creation of ships
            kind: CardKind.Ship,
            refNo: ship.refNo,
            name: ship.name,
        });
    }

    private loadParams<T>(defaults: T, _param: Partial<T>): T {
        return { ...defaults, ..._param };
    }

    private loadFreshGameState(params: ILoadFreshGameStateParams) {
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
