import { gameManager } from "..";
import { AppStatus, DEFAULT_APP_STATE, FP_AUTH_TOKEN, FP_GAME_CODE, IAppState } from "../../shared";
import { transformPlainAppStateToDomain } from "../../shared/transformers";
import { getGame } from "../apis/get-game";
import { updateComponents } from "../components/component-helper";
import { deleteAuthCookie, getCookie } from "../utils/cookie-helper";
import { getGameCode, removeGameCode } from "../utils/game-helper";

export class App {
    private _state: IAppState = DEFAULT_APP_STATE;

    public async start() {
        updateComponents(this._state);

        if (!this.hasExistingSession()) {
            return this.clearExistingSession();
        }

        await this.fetchExistingSession();
    }

    private hasExistingSession() {
        const gameCode = getGameCode();
        const authToken = getCookie(FP_AUTH_TOKEN);

        const hasExistingSession = !!(gameCode && authToken);

        return hasExistingSession;
    }

    private clearExistingSession() {
        removeGameCode();
        deleteAuthCookie();
    }

    private async fetchExistingSession() {
        updateComponents({ status: AppStatus.Initialising, loading: true });

        try {
            const response = await getGame(getGameCode());
            console.log("Existing game found:", response);
            const newState = transformPlainAppStateToDomain({
                status: response?.gameState.isOver ? AppStatus.GameOver : AppStatus.Initialised,
                loading: false,
                gameState: response?.gameState,
            });

            gameManager.saveCurrentPlayerStateV2(newState, { saveWithMerge: false });
            gameManager.setCurrentPlayer(getCookie(FP_AUTH_TOKEN));

            updateComponents();
        } catch (error) {
            if (error.code === 404) {
                console.log("Game not found or expired.");
                sessionStorage.removeItem(FP_GAME_CODE);
            }

            if (error.code === 403) {
                console.log("Game is full.");
                sessionStorage.removeItem(FP_GAME_CODE);
            }

            updateComponents({ status: AppStatus.NewGame, loading: false });
        }
    }
}
