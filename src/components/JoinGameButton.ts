import { FP_GAME_STATE } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { gameManager } from "..";
import { joinGame } from "../apis/join-game";
import { appConfig } from "../config/app-config";
import { checkIfNameIsFilled, setGameCode } from "../utils/game-helper";
import { setAppScreen } from "../utils/screen-helper";
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
        return this.ref;
    }

    setDisabled(isDisabled: boolean) {
        this.ref.disabled = isDisabled;
    }

    async onClick() {
        this.setDisabled(true); // TODO: should be handled by state
        const isLocal = appConfig.deployEnv === "local";
        const joinCodeInput = getComponents().input.joinCode;
        const playerNameInput = getComponents().input.playerName;

        if (!checkIfNameIsFilled()) {
            this.setDisabled(false);
            return playerNameInput.shakeForAwhile();
        }
        try {
            const response = await joinGame(joinCodeInput.value, playerNameInput.value);

            if (!response) {
                this.setDisabled(false);
                return;
            }

            const { gameCode, gameState, playerId } = response;
            const newState = { status: GameConfig.AppStatus.Initialised, loading: false, gameState: gameState! };

            if (isLocal) {
                // DO NOT DELETE: this item simulates Object in S3
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
            }

            this.setDisabled(false);
            setGameCode(gameCode);
            if (gameState) {
                // Seed the round-start snapshot so round 1's playback can rewind.
                gameManager.trackRoundSnapshots(playerId, gameState);
            }
            gameManager.saveAppState(newState);

            setAppScreen(GameConfig.AppScreen.Game);
            updateComponents();
        } catch (error) {
            this.setDisabled(false);
            updateComponents({ status: GameConfig.AppStatus.Error });
        }
    }

    updateState(_state: IAppState) {
        const { status } = _state;

        // FIXME: do we still need to separate state handling?
        switch (status) {
            case GameConfig.AppStatus.NewGame:
            case GameConfig.AppStatus.Initialised:
            case GameConfig.AppStatus.Initialising:
                this.setDisabled(false);
                break;
        }
    }
}
