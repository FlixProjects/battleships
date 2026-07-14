import { GameConfig } from "@shared/index";
import { IAppState, IPlayer } from "@shared/types";
import { BaseComponent } from "../BaseComponent";
import { PlayerCard } from "./PlayerCard";

interface State {
    playerCards: PlayerCard[];
}

export class PlayerCards extends BaseComponent {
    private bottomRef: HTMLElement;
    private panels: HTMLElement[] = [];

    private state: State = {
        playerCards: [],
    };

    constructor() {
        super();
        this.build();
    }

    build() {
        const gameArea = document.getElementById("gameArea");

        const topPanel = this.buildPanel();
        this.ref = this.buildPlayerList(topPanel);
        gameArea?.before(topPanel);

        const bottomPanel = this.buildPanel();
        this.bottomRef = this.buildPlayerList(bottomPanel);
        gameArea?.after(bottomPanel);

        this.panels = [topPanel, bottomPanel];
        return this.ref;
    }

    private buildPanel() {
        const panel = document.createElement("div");
        panel.className = "player-info";
        // Hidden until updateState confirms we are in-game.
        panel.style.display = "none";
        // panel.style.background = "#1f1f1f";
        panel.style.borderRadius = "10px";
        panel.style.padding = "1rem";
        panel.style.color = "#eee";
        // panel.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
        return panel;
    }

    private buildPlayerList(panel: HTMLElement) {
        const list = document.createElement("div");
        list.style.display = "flex";
        list.style.justifyContent = "space-around";
        list.style.gap = "1rem";
        panel.appendChild(list);
        return list;
    }

    addPlayerCard(player: IPlayer) {
        const playerCard = new PlayerCard({ playerName: player.name, playerId: player.id, faction: player.faction });
        this.state.playerCards.push(playerCard);
        const container = player.order === 0 ? this.ref : this.bottomRef;
        container.appendChild(playerCard.ref);
    }

    reset() {
        this.state.playerCards.forEach((playerCard) => {
            playerCard.ref.remove();
        });
        this.state.playerCards = [];
    }

    updateState(_state?: IAppState): void {
        const inGame = _state?.screen === GameConfig.AppScreen.InGame;
        this.panels.forEach((panel) => {
            panel.style.display = inGame ? "" : "none";
        });

        this.reset();
        _state?.gameState?.players.forEach((player) => {
            this.addPlayerCard(player);
        });
    }
}
