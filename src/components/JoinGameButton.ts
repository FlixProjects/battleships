import { gameManager } from "..";
import { FP_GAME_STATE } from "../../shared";
import { joinGame } from "../apis/join-game";
import { appConfig } from "../config/app-config";
import { AppStatus, IAppState } from "../types";
import { checkIfNameIsFilled, setGameCode } from "../utils/game-helper";
import { getComponents, updateComponents } from "./component-helper";
import { HTMLButton } from "./native/Button";

export class JoinGameButton extends HTMLButton {
    constructor() {
        super();
        this.build();
    }

    build() {
        this.ref = document.getElementById("joinGameBtn") as HTMLButtonElement;
        this.addClickEventListener();
    }

    async onClick() {
        const isLocal = appConfig.deployEnv === "local";
        const joinCodeInput = getComponents().input.joinCode;
        const playerNameInput = getComponents().input.playerName;

        if (!checkIfNameIsFilled()) {
            return playerNameInput.shakeForAwhile();
        }
        try {
            const response = await joinGame(joinCodeInput.value, playerNameInput.value);

            if (!response) {
                return;
            }

            const { gameCode, gameState, playerId } = response;
            const newState = { status: AppStatus.Initialised, loading: false, gameState: gameState! };

            if (isLocal) {
                // if you join on local it means local multiplayer
                // update source of truth
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
                gameManager.setCurrentPlayer(playerId);
            }

            setGameCode(gameCode);
            gameManager.savePlayerState(playerId, newState);

            updateComponents(newState);
        } catch (error) {
            updateComponents({ status: AppStatus.Error });
        }
    }

    updateState(_state: IAppState) {
        const element = this.ref;
        const { status } = _state;

        switch (status) {
            case AppStatus.Initialised:
                element.disabled = true;
                break;
            case AppStatus.NewGame:
                element.disabled = false;
                break;
            case AppStatus.Initialising:
                element.disabled = true;
                break;
        }
    }
}
