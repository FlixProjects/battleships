import { DEFAULT_APP_STATE } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { gameManager } from "..";
import { getGame } from "../apis/get-game";
import { updateComponents } from "../components/component-helper";
import { loadStyles } from "../css-anim-styles";
import { getGameCode, isWaitingForOtherPlayer } from "../utils/game-helper";
import { setAppScreen } from "../utils/screen-helper";
import { transformPlainAppStateToFEDomain } from "../utils/transformers";

export class App {
    private _state: IAppState = transformPlainAppStateToFEDomain(DEFAULT_APP_STATE);
    public async start() {
        loadStyles();
        const gameCode = getGameCode();
        const isLoggedIn = gameManager.isLoggedIn;

        if (gameCode && isLoggedIn) {
            setAppScreen(GameConfig.AppScreen.Game);
            return await this.fetchExistingSession();
        }

        const hasExistingStaleSession = gameCode && !isLoggedIn;
        const isLoggedInButNoData = !gameCode && isLoggedIn;

        if (hasExistingStaleSession) {
            this.clearStaleSession();
        } else if (isLoggedInButNoData) {
            setAppScreen(GameConfig.AppScreen.Games);
        } else if (!isLoggedIn) {
            setAppScreen(GameConfig.AppScreen.Login);
        }

        return updateComponents(this._state);
    }

    private clearStaleSession() {
        sessionStorage.clear();
        setAppScreen(GameConfig.AppScreen.Login);
    }

    private async fetchExistingSession() {
        updateComponents({ status: GameConfig.AppStatus.Initialising, loading: true });
        const gameCode = getGameCode();
        if (!gameCode) {
            return;
        }

        await getGame(gameCode, { resolveLocalActions: true, saveWithMerge: false });
    }

    private getGameStatus(isOver: boolean) {
        return isOver
            ? GameConfig.AppStatus.GameOver
            : isWaitingForOtherPlayer(gameManager.state.gameState)
              ? GameConfig.AppStatus.WaitingForOtherPlayer
              : GameConfig.AppStatus.ReadyToSubmit;
    }
}
