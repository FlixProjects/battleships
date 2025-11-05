import { AppStatus, GameState, IAppState } from "../types";
import { addPlayer } from "./add-player";
import { PlayerNameInput } from "./PlayerNameInput";

const INITIAL_GAME_STATE: GameState = {
    code: "",
    players: [],
};

const _state: IAppState = {
    status: AppStatus.Initialising,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

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
export const updateComponents = (gameState: GameState) => {
    _state.gameState = gameState;

    updatePlayers();
};

const updatePlayers = () => {
    const playerComponents = document.getElementsByClassName("player-container"); // TODO: make this a constant

    Array.from(playerComponents).forEach((el) => el.remove());

    _state.gameState?.players.forEach((player) => {
        addPlayer(player.id, player.name);
    });
};
