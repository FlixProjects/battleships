import { COMPONENT_ID, GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getGames } from "../apis/get-games";
import { isUnjoinedLocalPlayer } from "../utils/game-helper";
import { getAppScreen, setAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { updateComponents } from "./component-helper";
import { gameManager } from "..";
import { GamesContainer } from "./games/GamesContainer";
import { GameRow } from "./games/GameRow";

/**
 * Lobby-only list of the games the player has joined, shown directly below
 * the GameActions controls. A guest can only ever have one (the stored
 * session game); clicking a row returns to the InGame screen.
 */
export class GamesPage extends BaseComponent {
    private gamesContainer: GamesContainer;
    private loading: boolean = false;
    private games: string[] = [];

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();
        if (this.loading || !gameManager.isLoggedIn || screen !== GameConfig.AppScreen.Games) {
            return;
        }
        this.fetchGames();
        this.build();

        this.ref.style.display = screen === GameConfig.AppScreen.Games ? "flex" : "none";
    }
    // FIXME: Is there a better way to ensure no infinite calls?
    // Only works because its a single component
    private async fetchGames() {
        if (this.loading) {
            return;
        }
        this.loading = true;
        const { games } = await getGames();
        this.games = games;
        this.renderGames();
        this.loading = false;
    }

    build() {
        this.removeChildren();
        const card = document.querySelector(".card");

        if (!card || card.querySelector(`#${COMPONENT_ID.GAMES}`)) {
            return this.ref;
        }

        this.ref = document.createElement("section");
        this.ref.id = COMPONENT_ID.GAMES;
        this.addStyles();

        this.buildHeading();

        // Sits directly below the create/join controls.
        const controls = card.querySelector("#controls");
        if (controls) {
            controls.insertAdjacentElement("afterend", this.ref);
        } else {
            card.prepend(this.ref);
        }

        this.renderGames();

        return this.ref;
    }

    addStyles() {
        const style = this.ref.style;
        style.display = "flex";
        style.flexDirection = "column";
        style.gap = "8px";
    }

    private buildHeading() {
        const heading = document.createElement("h3");
        heading.textContent = "Your Games";

        const style = heading.style;
        style.margin = "0";
        style.fontSize = "12px";
        style.fontWeight = "600";
        style.textTransform = "uppercase";
        style.letterSpacing = "1.5px";
        style.color = "var(--muted)";

        this.ref.appendChild(heading);
    }

    // No child components hold refs in here, so the rows can rebuild freely.
    private renderGames() {
        if (!this.gamesContainer) {
            this.gamesContainer = new GamesContainer();
        }

        this.addChild(this.gamesContainer);
        this.ref.appendChild(this.gamesContainer.build());

        this.games.map((gameCode) => {
            if (gameCode && !isUnjoinedLocalPlayer()) {
                const gameRow = new GameRow({ gameCode });
                this.gamesContainer.addChild(gameRow);
                this.gamesContainer.ref.appendChild(gameRow.build());
            } else {
                this.gamesContainer.ref.appendChild(this.buildEmptyState());
            }
        });
    }

    private buildEmptyState() {
        const empty = document.createElement("p");
        empty.textContent = "No games yet — create or join one above.";
        empty.style.margin = "0";
        empty.style.fontSize = "13px";
        empty.style.color = "var(--muted)";

        return empty;
    }
}
