import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { GameCodeText } from "./GameCodeText";
import { applyButtonStyles, applyInputStyles } from "./styles/inline-styles";

export class GameActions extends BaseComponent {
    private left: HTMLDivElement;
    private right: HTMLDivElement;
    private gameCode: GameCodeText;
    private buttons: HTMLButtonElement[] = [];
    private inputs: HTMLInputElement[] = [];

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.build();

        // Lobby-only; never unmounted — children hold refs into this subtree.
        const screen = _state?.screen ?? getAppScreen();
        this.ref.style.display = screen === GameConfig.AppScreen.Lobby ? "flex" : "none";

        this.gameCode.updateState(_state);
    }

    build() {
        const card = document.querySelector(".card");

        if (!card || card.querySelector("#controls")) {
            return this.ref;
        }

        this.ref = document.createElement("div");
        this.ref.id = "controls";
        this.addStyles();

        this.ref.appendChild(this.buildCreateGroup());
        this.ref.appendChild(this.buildJoinGroup());
        this.watchViewportWidth();

        card.prepend(this.ref);

        return this.ref;
    }

    addStyles() {
        const style = this.ref.style;
        style.display = "flex";
        style.justifyContent = "space-between";
        style.flexWrap = "wrap";
    }

    private buildCreateGroup() {
        this.left = this.buildGroup();

        const createGameBtn = document.createElement("button");
        createGameBtn.id = "createGameBtn";
        createGameBtn.textContent = "Create Game";
        applyButtonStyles(createGameBtn, { primary: true });
        this.buttons.push(createGameBtn);

        this.left.appendChild(createGameBtn);
        this.gameCode = new GameCodeText(this.left);

        return this.left;
    }

    private buildJoinGroup() {
        this.right = this.buildGroup();

        const joinGameBtn = document.createElement("button");
        joinGameBtn.id = "joinGameBtn";
        joinGameBtn.textContent = "Join Game";
        applyButtonStyles(joinGameBtn);
        this.buttons.push(joinGameBtn);

        this.right.append(
            this.buildInput("playerName", "Enter your name", 20),
            this.buildInput("joinCode", "Enter Code", 4),
            joinGameBtn,
        );

        return this.right;
    }

    private buildGroup() {
        const group = document.createElement("div");
        group.style.display = "flex";
        group.style.gap = "10px";
        group.style.alignItems = "center";

        return group;
    }

    private buildInput(id: string, placeholder: string, maxLength: number) {
        const input = document.createElement("input");
        input.type = "text";
        input.id = id;
        input.placeholder = placeholder;
        input.maxLength = maxLength;
        applyInputStyles(input);
        this.inputs.push(input);

        return input;
    }

    // Inline styles cannot express the stylesheet's ≤520px media query, so
    // watch the viewport and swap the affected properties by hand.
    private watchViewportWidth() {
        const narrowViewport = window.matchMedia("(max-width: 520px)");

        this.applyResponsiveStyles(narrowViewport.matches);
        narrowViewport.addEventListener("change", (event) => this.applyResponsiveStyles(event.matches));
    }

    private applyResponsiveStyles(isNarrow: boolean) {
        if (isNarrow) {
            this.applyNarrowStyles();
        } else {
            this.applyWideStyles();
        }
    }

    private applyNarrowStyles() {
        this.ref.style.flexDirection = "column";
        this.ref.style.alignItems = "stretch";
        this.ref.style.gap = "12px";

        this.left.style.width = "100%";
        this.left.style.justifyContent = "space-between";

        this.right.style.flexDirection = "column";
        this.right.style.justifyContent = "flex-start";
        this.right.style.gap = "8px";

        this.buttons.forEach((btn) => (btn.style.width = "100%"));
        this.inputs.forEach((input) => (input.style.width = "100%"));
    }

    private applyWideStyles() {
        this.ref.style.flexDirection = "row";
        this.ref.style.alignItems = "center";
        this.ref.style.gap = "4px";

        this.left.style.width = "";
        this.left.style.justifyContent = "";

        this.right.style.flexDirection = "row";
        this.right.style.justifyContent = "";
        this.right.style.gap = "10px";

        this.buttons.forEach((btn) => (btn.style.width = ""));
        this.inputs.forEach((input) => (input.style.width = "160px"));
    }
}
