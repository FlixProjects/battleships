import { AppStatus, IAppState } from "../src/types";
import { GameState, IShip } from "./types";
import { getNewBoard } from "./utils";

export const FP_AUTH_TOKEN = "fp-auth-token";
export const FP_USER_ID = "fp-user-id";

export const FP_GAME_STATE = "fp-game-state";
export const FP_GAME_CODE = "fp-game-code";

export const FP_CURRENT_PLAYER = "fp-current-player";
export const FP_PLAYER_STATES = "fp-player-states";

export const LOCAL_TEMP_PLAYER_ID = "temp-id";

export const INITIAL_GAME_STATE: GameState = {
    code: "",
    players: [],
    board: getNewBoard(),
};

export const DEFAULT_APP_STATE: IAppState = {
    status: AppStatus.NewGame,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

export const BOARD_ROWS = 14;
export const BOARD_COLUMNS = 7;

export const SHIPS_CONFIG: Record<string, IShip> = {
    frigate0: {
        refNo: "frigate0",
        name: "Frigate",
        deployed: false,
        dimensions: [1, 1],
    },
};
