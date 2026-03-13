import { gameManager } from "../..";
import { GameStateManager } from "../../../shared";
import { BaseComponent } from "../BaseComponent";
import { InitiativeIcon } from "./InitiativeIcon";
import { InitiativeName } from "./InitiativeName";

export class InitiativeDisplay extends BaseComponent {
    private isFirstPlayer: boolean;
    private initiativePlayerName: string;

    build() {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const gameState = gsm.gameState;
        const currentPlayer = gsm.getPlayer(gameManager.getCurrentPlayerId()).id;

        if (!gameState?.initiative) return null;

        this.initiativePlayerName = gameState.players.find((p) => p.id === gameState.initiative)?.name || "Unknown";
        this.isFirstPlayer = gameState.initiative === gameState.getFirstPlayerId();
        this.ref = document.createElement("div");
        this.addStyles();

        const icon = new InitiativeIcon(this.isFirstPlayer);
        const name = new InitiativeName(this.initiativePlayerName, this.isFirstPlayer);

        this.addChild(icon);
        this.addChild(name);

        this.ref.appendChild(icon.build());
        this.ref.appendChild(name.build());

        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.padding = "12px";
        this.ref.style.background = this.isFirstPlayer
            ? "linear-gradient(135deg, rgba(110, 231, 183, 0.15), rgba(96, 165, 250, 0.15))"
            : "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.12))";
        this.ref.style.borderRadius = "8px";
        this.ref.style.marginBottom = "8px";
        this.ref.style.textAlign = "center";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "center";
        this.ref.style.gap = "8px";
        this.ref.style.border = this.isFirstPlayer ? "1px solid #6ee7b7" : "1px solid #fbbf24";
        this.ref.style.boxShadow = this.isFirstPlayer
            ? "0 0 20px rgba(110, 231, 183, 0.3)"
            : "0 0 15px rgba(251, 191, 36, 0.25)";
    }
}
