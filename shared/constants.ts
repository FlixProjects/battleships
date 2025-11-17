import { AppStatus, IAppState } from "../src/types";
import { GameState, IShipTemplate } from "./types";
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

export const SHIPS_CONFIG: Record<string, IShipTemplate> = {
    frigate0: {
        refNo: "frigate0",
        name: "Frigate",
        deployed: false,
        dimensions: [1, 1],
        commandPointCost: 1,
    },
    flagship0: {
        refNo: "flagship0",
        name: "Flagship",
        deployed: false,
        dimensions: [1, 1],
        commandPointCost: 0,
    },
};

export const COLOR = {
    TEAL: "teal",
    ORANGE: "orange",
    PINK: "pink",
} as const;
export type TColor = typeof COLOR[keyof typeof COLOR];

export const COLOR_FILTER = {
    [COLOR.TEAL]:
        "brightness(0) saturate(100%) invert(83%) sepia(10%) saturate(1623%) hue-rotate(101deg) brightness(97%) contrast(91%)",
    [COLOR.ORANGE]:
        "brightness(0) saturate(100%) invert(91%) sepia(13%) saturate(4577%) hue-rotate(332deg) brightness(96%) contrast(100%)",
    [COLOR.PINK]:
        "brightness(0) saturate(100%) invert(55%) sepia(16%) saturate(4155%) hue-rotate(292deg) brightness(94%) contrast(84%)",
};

export const COLOR_RGB_VALUE = {
    [COLOR.TEAL]: "110, 231, 183",
    [COLOR.ORANGE]: "245, 181, 44",
    [COLOR.PINK]: "221, 94, 170",
};

export const COLOR_RGBA = {
    [COLOR.TEAL]: `rgba(${COLOR_RGB_VALUE[COLOR.TEAL]}, 1)`,
    [COLOR.ORANGE]: `rgba(${COLOR_RGB_VALUE[COLOR.ORANGE]}, 1)`,
    [COLOR.PINK]: `rgba(${COLOR_RGB_VALUE[COLOR.PINK]}, 1)`,
};
