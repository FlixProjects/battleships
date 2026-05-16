import { AppStatus } from "./config/constants";
import { IPlainAppState, IPlainGameState } from "./types";

export const FP_AUTH_TOKEN = "fp-auth-token";
export const FP_USER_ID = "fp-user-id";

export const FP_GAME_STATE = "fp-game-state";
export const FP_GAME_CODE = "fp-game-code";

export const FP_CURRENT_PLAYER = "fp-current-player";
export const FP_PLAYER_STATES = "fp-player-states";

export const LOCAL_TEMP_PLAYER_ID = "temp-id";

// Plain (data-only) defaults. Consumers that want a hydrated `IAppState` /
// `GameState` wrap with `transformPlainAppStateToDomain(DEFAULT_APP_STATE)` —
// keeps this module free of any class import / construction-at-load cycle.
export const INITIAL_GAME_STATE: IPlainGameState = {
    code: "",
    players: [],
    ships: [],
    hulls: [],
    cards: [],
    decks: [],
    board: { grid: [] },
    winners: [],
    isOver: false,
    currentRound: 0,
};

export const DEFAULT_APP_STATE: IPlainAppState = {
    status: AppStatus.NewGame,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

// TODO: move row and column to GameConfig
export const BOARD_ROWS = 10;
export const BOARD_COLUMNS = 7;
export const CELL_SEPARATOR = "/";
export const TILE_SIZE_PX = 48;
export const TILE_GAP_PX = 0;

export const Z_INDEX = {
    TOAST: "100",
    ACTION_PANEL: "100",
    STATIC_LAYER: "1",
    PROJECTILE: "100",
    ACTION_MENU: "1000",
    TARGET_ATTACK_ICON: "10",
};

export const COLOR = {
    TEAL: "teal",
    ORANGE: "orange",
    PINK: "pink",
    RED: "red",
} as const;
export type TColor = (typeof COLOR)[keyof typeof COLOR];

export const COLOR_FILTER = {
    [COLOR.TEAL]:
        "brightness(0) saturate(100%) invert(83%) sepia(10%) saturate(1623%) hue-rotate(101deg) brightness(97%) contrast(91%)",
    [COLOR.ORANGE]:
        "brightness(0) saturate(100%) invert(91%) sepia(13%) saturate(4577%) hue-rotate(332deg) brightness(96%) contrast(100%)",
    [COLOR.PINK]:
        "brightness(0) saturate(100%) invert(55%) sepia(16%) saturate(4155%) hue-rotate(292deg) brightness(94%) contrast(84%)",
    [COLOR.RED]:
        "brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(7426%) hue-rotate(358deg) brightness(98%) contrast(118%)",
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

export const SELECTABLE_ID = {
    ACTION_MENU: "action-menu",
    PATH_MENU: "path-menu",
};

export const ASSET_PATHS = {
    TARGET_ICON: "./assets/attack-icon.png",
    MOVE_ICON: "./assets/move-icon.svg",
};

export const COMPONENT_ID = {
    GAME_AREA: "gameArea",
    GAME_BOARD_CONTAINER: "gameBoardContainer",
    GAME_BOARD: "gameBoard",
    GAME_BOARD_STATIC_LAYER: "gameBoardStaticLayer",
} as const;
export const ANIMATION_LAYER_ID = COMPONENT_ID.GAME_BOARD_CONTAINER;
export const GAME_BOARD_ID = "gameBoard";

export const ERROR_CODE = {
    SYS_NOT_FOUND: "SYS_NOT_FOUND",
    SYS_INVALID_PARAMS: "SYS_INVALID_PARAMS",
    MOVE_ERROR_LOCATION_OCCUPIED: "MOVE_ERROR_LOCATION_OCCUPIED",
    MOVE_ERROR_INSUFFICIENT_MOVEMENT: "MOVE_ERROR_INSUFFICIENT_MOVEMENT",
} as const;
export type TErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export const DEPLOYED_HULL_PREFIX = `hull-`;
export const DEPLOYED_SHIP_PREFIX = `ship-`;
