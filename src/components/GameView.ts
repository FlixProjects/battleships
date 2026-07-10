import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { GameCodeText } from "./GameCodeText";

/**
 * Screen-gates the static in-game blocks. The main card (which also hosts
 * GameActions) is hidden on the Login screen; the game blocks (status bar,
 * player list, board area) only show once a game is created/joined/restored.
 * Also owns (and state-forwards) the in-game GameCodeText in the status bar.
 */
export class GameView extends BaseComponent {
    public ref = document.querySelector("main.card") as HTMLElement;

    private gameBlocks = [
        document.getElementById("status-bar"),
        document.getElementById("playerInfo"),
        document.getElementById("gameArea"),
    ];

    private gameCode = new GameCodeText(document.getElementById("status-bar"));

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();

        // Empty string defers back to the stylesheet's display value.
        this.ref.style.display = screen === GameConfig.AppScreen.Login ? "none" : "";

        const inGame = screen === GameConfig.AppScreen.InGame;
        this.gameBlocks.forEach((block) => {
            if (block) {
                block.style.display = inGame ? "" : "none";
            }
        });

        this.gameCode.updateState(_state);
    }
}
