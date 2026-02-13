import { gameManager } from "../";
import { FP_GAME_STATE, AppStatus, IAppState } from "../../shared";
import { createGame } from "../apis/create-game";
import { isLocal } from "../config/app-config";
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

    setDisabled(isDisabled: boolean) {
        this.ref.disabled = isDisabled;
    }

    async onClick() {
        this.setDisabled(true); // TODO: should be handled by state
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
                // DO NOT DELETE: this item simulates Object in S3
                gameManager.savePlainAppState(newState);
            }

            updateComponents();
        } catch (error) {
            this.setDisabled(false);
            updateComponents({ status: AppStatus.Error });
        }
    }

    updateState(_state: IAppState) {
        const { status } = _state;

        switch (status) {
            case AppStatus.NewGame:
                this.setDisabled(false);
                break;
            case AppStatus.Initialised:
            case AppStatus.Initialising:
                this.setDisabled(true);
                break;
        }
    }
}
