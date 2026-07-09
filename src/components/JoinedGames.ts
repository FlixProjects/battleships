import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getGameCode } from "../utils/game-helper";
import { getAppScreen, setAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { updateComponents } from "./component-helper";

/**
 * Lobby-only list of the games the player has joined, shown directly below
 * the GameActions controls. A guest can only ever have one (the stored
 * session game); clicking a row returns to the InGame screen.
 */
export class JoinedGames extends BaseComponent {
    private list: HTMLDivElement;

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.build();

        const screen = _state?.screen ?? getAppScreen();
        this.ref.style.display = screen === GameConfig.AppScreen.Lobby ? "flex" : "none";

        this.renderGames();
    }

    build() {
        const card = document.querySelector(".card");

        if (!card || card.querySelector("#joined-games")) {
            return this.ref;
        }

        this.ref = document.createElement("section");
        this.ref.id = "joined-games";
        this.addStyles();

        this.buildHeading();
        this.buildList();

        // Sits directly below the create/join controls.
        const controls = card.querySelector("#controls");
        if (controls) {
            controls.insertAdjacentElement("afterend", this.ref);
        } else {
            card.prepend(this.ref);
        }

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

    private buildList() {
        this.list = document.createElement("div");
        this.list.style.display = "flex";
        this.list.style.flexDirection = "column";
        this.list.style.gap = "8px";

        this.ref.appendChild(this.list);
    }

    // No child components hold refs in here, so the rows can rebuild freely.
    private renderGames() {
        this.list.replaceChildren();

        const gameCode = getGameCode();

        if (gameCode) {
            this.list.appendChild(this.buildGameRow(gameCode));
        } else {
            this.list.appendChild(this.buildEmptyState());
        }
    }

    private buildGameRow(gameCode: string) {
        const row = document.createElement("button");
        this.addGameRowStyles(row);

        const code = document.createElement("span");
        code.textContent = gameCode;
        code.style.fontWeight = "700";
        code.style.fontSize = "16px";
        code.style.letterSpacing = "3px";
        code.style.color = "var(--accent)";
        code.style.textShadow = "0 0 10px rgba(110, 231, 183, 0.4)";

        const resume = document.createElement("span");
        resume.textContent = "Resume →";
        resume.style.fontSize = "13px";
        resume.style.color = "var(--muted)";

        row.append(code, resume);

        row.addEventListener("mouseenter", () => (row.style.background = "var(--glass)"));
        row.addEventListener("mouseleave", () => (row.style.background = "var(--glass-2)"));
        row.addEventListener("click", (event) => {
            event.stopPropagation();
            setAppScreen(GameConfig.AppScreen.InGame);
            updateComponents();
        });

        return row;
    }

    private addGameRowStyles(row: HTMLButtonElement) {
        const style = row.style;
        style.display = "flex";
        style.alignItems = "center";
        style.justifyContent = "space-between";
        style.padding = "12px 14px";
        style.background = "var(--glass-2)";
        style.border = "1px solid var(--glass-border)";
        style.borderRadius = "10px";
        style.color = "inherit";
        style.font = "inherit";
        style.textAlign = "left";
        style.cursor = "pointer";
        style.transition = "background var(--transition)";
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
