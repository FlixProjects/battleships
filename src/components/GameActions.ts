import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";

/**
 * The create/join controls, extracted from static index.html markup.
 * Builds its own DOM but keeps the original element ids ("createGameBtn",
 * "gameCode", "playerName", "joinCode", "joinGameBtn") — the child button/input
 * components locate their refs by id, so GameActions must be constructed
 * before them and must never rebuild once mounted.
 */
export class GameActions extends BaseComponent {
    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.build();

        // Visible on Lobby and InGame (the game code lives here); never
        // unmounted — children hold refs into this subtree. Empty string
        // defers back to the stylesheet's `.controls` display value.
        const screen = _state?.screen ?? getAppScreen();
        this.ref.style.display = screen === GameConfig.AppScreen.Login ? "none" : "";
    }

    build() {
        const card = document.querySelector(".card");

        if (!card || card.querySelector("#controls")) {
            return this.ref;
        }

        this.ref = document.createElement("div");
        this.ref.id = "controls";
        this.ref.classList.add("controls");

        this.ref.appendChild(this.buildCreateGroup());
        this.ref.appendChild(this.buildJoinGroup());

        card.prepend(this.ref);

        return this.ref;
    }

    private buildCreateGroup() {
        const left = document.createElement("div");
        left.classList.add("left");

        const createGameBtn = document.createElement("button");
        createGameBtn.id = "createGameBtn";
        createGameBtn.classList.add("btn", "primary", "game-btn");
        createGameBtn.textContent = "Create Game";

        const gameCode = document.createElement("h1");
        gameCode.id = "gameCode";
        gameCode.classList.add("title");

        left.append(createGameBtn, gameCode);

        return left;
    }

    private buildJoinGroup() {
        const right = document.createElement("div");
        right.classList.add("right", "join-group");

        const joinGameBtn = document.createElement("button");
        joinGameBtn.id = "joinGameBtn";
        joinGameBtn.classList.add("btn", "game-btn");
        joinGameBtn.textContent = "Join Game";

        right.append(
            this.buildInput("playerName", "Enter your name", 20),
            this.buildInput("joinCode", "Enter Code", 4),
            joinGameBtn,
        );

        return right;
    }

    private buildInput(id: string, placeholder: string, maxLength: number) {
        const input = document.createElement("input");
        input.type = "text";
        input.id = id;
        input.classList.add("input");
        input.placeholder = placeholder;
        input.maxLength = maxLength;

        return input;
    }
}
