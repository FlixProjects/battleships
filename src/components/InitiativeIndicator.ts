import { IAppState } from "@shared/types";
import { BaseComponent } from "./BaseComponent";

export class InitiativeIndicator extends BaseComponent {
    public ref = document.getElementById("initiative-indicator") as HTMLDivElement;

    updateState(appState: Partial<IAppState>) {
        const { gameState, currentPlayer } = appState;

        if (!gameState?.initiative || !gameState?.players?.length) {
            this.ref.innerHTML = "";
            return;
        }

        const initiativePlayer = gameState.players.find((p) => p.id === gameState.initiative);
        const hasInitiative = currentPlayer === gameState.initiative;

        this.ref.innerHTML = `
            <div class="initiative-badge ${hasInitiative ? "has-initiative" : ""}">
                <svg class="initiative-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
                </svg>
                <span class="initiative-text">${initiativePlayer?.name || "Unknown"}</span>
            </div>
        `;
    }
}
