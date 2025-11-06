import { appConfig } from "../config/app-config";
import { FP_GAME_STATE, FP_GAME_CODE } from "../constants";
import { AppStatus, GameState, IAppState } from "../types";
import { addPlayer } from "./add-player";
import { enableGameCodeCopy } from "./enable-game-code-copy";
import { PlayerNameInput } from "./PlayerNameInput";

const INITIAL_GAME_STATE: GameState = {
    code: "",
    players: [],
};

const DEFAULT_APP_STATE: IAppState = {
    status: AppStatus.Initialising,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

let _state: IAppState = DEFAULT_APP_STATE;

const isLocal = appConfig.deployEnv === "local";

export const getComponents = () => {
    const button = { ...getStaticComponents().button };
    const span = { ...getStaticComponents().span };
    const input = { ...getStaticComponents().input };

    return { button, span, input };
};

const getStaticComponents = () => {
    // Buttons
    const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
    const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;

    // Spans
    const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;

    // Inputs
    const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;
    const playerNameInput = new PlayerNameInput();

    return {
        button: {
            joinGame: joinGameBtn,
            createGame: createGameBtn,
        },
        span: {
            gameCode: gameCodeEl,
        },
        input: {
            joinCode: joinCodeInput,
            playerName: playerNameInput,
        },
    };
};

export const updateComponents = (appState: Partial<IAppState>) => {
    _state = { ..._state, ...appState };

    updateJoinButton();
    updateCreateButton();
    updateGameCodeSpan();
    updatePlayers();
};

const updatePlayers = () => {
    const playerComponents = document.getElementsByClassName("player-container"); // TODO: make this a constant

    Array.from(playerComponents).forEach((el) => el.remove());

    _state.gameState?.players.forEach((player) => {
        addPlayer(player.id, player.name);
    });
};

const updateJoinButton = () => {
    const element = getComponents().button.joinGame;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        const gameCode = gameState.code;

        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
        }
        sessionStorage.setItem(FP_GAME_CODE, gameCode);

        element.disabled = true;
    }

    if (status === AppStatus.NewGame) {
        element.disabled = false;
    }
};

const updateCreateButton = () => {
    const element = getComponents().button.createGame;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        const gameCode = gameState.code;

        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
        }
        sessionStorage.setItem(FP_GAME_CODE, gameCode);

        if (gameCode) {
            enableGameCodeCopy();
        }
        element.disabled = true;
    }

    if (status === AppStatus.NewGame) {
        element.disabled = false;
    }
};

const updateGameCodeSpan = () => {
    const element = getComponents().span.gameCode;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        element.innerText = gameState.code;
    }

    if (status === AppStatus.Error) {
        element.innerHTML = "error";
    }
};
