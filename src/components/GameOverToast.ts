import { gameManager } from "..";
import { IAppState } from "../types";
import { Toast, ToastOptions } from "./Toast";

const SHARED_OPTIONS = {
    permanent: true,
    animate: false,
};

const WIN_OPTIONS: ToastOptions = {
    message: "You won!",
    type: "success",
    ...SHARED_OPTIONS,
};

const LOSE_OPTIONS: ToastOptions = {
    message: "You lost!",
    type: "error",
    ...SHARED_OPTIONS,
};

const DRAW_OPTIONS: ToastOptions = {
    message: "Game ended in a draw",
    type: "info",
    ...SHARED_OPTIONS,
};

const GAME_OVER_TOAST_ID = "game-over-toast";

export class GameOverToast extends Toast {
    constructor() {
        super({ message: "" });
        this.id = GAME_OVER_TOAST_ID;
    }

    public updateState(_state?: IAppState): void {
        const gameState = _state?.gameState;
        this.removeIfExisting();

        if (gameState.isOver) {
            if (gameState.winners.length > 0 && !gameState.players.some((p) => p.ready)) {
                const isWinner = gameState.winners.includes(gameManager.getCurrentPlayerId());

                const isDraw = gameState.winners.length > 1;

                if (isDraw) {
                    this.options = DRAW_OPTIONS;
                } else if (isWinner) {
                    this.options = WIN_OPTIONS;
                } else {
                    this.options = LOSE_OPTIONS;
                }

                GameOverToast.show(this.options, GAME_OVER_TOAST_ID);
            }
        }
    }

    private removeIfExisting() {
        GameOverToast.container.querySelector(`#${GAME_OVER_TOAST_ID}`)?.remove();
    }
}
