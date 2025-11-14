import { gameManager } from "../";
import { FP_GAME_STATE } from "../../shared";
import { createGame } from "../apis/create-game";
import { isLocal } from "../config/app-config";
import { AppStatus, IAppState } from "../types";
import { checkIfNameIsFilled, setCurrentPlayer, setGameCode } from "../utils/game-helper";
import { getComponents, updateComponents } from "./component-helper";
import { HTMLButton } from "./native/Button";

export class CreateGameButton extends HTMLButton {
    constructor() {
        super();
        this.build();
    }

    build() {
        this.ref = document.getElementById("createGameBtn") as HTMLButtonElement;
        this.addClickEventListener();
        return this.ref;
    }

    async onClick() {
        const playerNameInput = getComponents().input.playerName;

        if (!checkIfNameIsFilled()) {
            return playerNameInput.shakeForAwhile();
        }

        try {
            const response = await createGame(playerNameInput.value);

            if (!response) {
                return;
            }

            const { gameCode, gameState, playerId } = response;

            if (isLocal) {
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
            }

            setGameCode(gameCode);
            setCurrentPlayer(playerId);

            const newState = {
                status: AppStatus.Initialised,
                loading: false,
                gameState,
            };

            if (playerId) {
                gameManager.savePlayerState(playerId, newState);
            }

            updateComponents();
        } catch (error) {
            updateComponents({ status: AppStatus.Error });
        }
    }

    updateState(_state: IAppState) {
        const element = this.ref;
        const { status } = _state;

        switch(status) {
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
