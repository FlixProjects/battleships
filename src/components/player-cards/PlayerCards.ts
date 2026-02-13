import { IAppState } from "../../../shared";
import { BaseComponent } from "../BaseComponent";
import { PlayerCard } from "./PlayerCard";

interface State {
    playerCards: PlayerCard[];
}

export class PlayerCards extends BaseComponent {
    private state: State = {
        playerCards: [],
    };

    constructor() {
        super();
        this.build();
    }

    build() {
        this.ref = document.getElementById("playerList");
        return this.ref;
    }

    addPlayerCard(playerName: string, playerId: string) {
        const playerCard = new PlayerCard({ playerName, playerId });
        this.state.playerCards.push(playerCard);
        this.ref.appendChild(playerCard.ref);
    }

    reset() {
        this.state.playerCards.forEach((playerCard) => {
            playerCard.ref.remove();
        });
        this.state.playerCards = [];
    }

    updateState(_state?: IAppState): void {
        this.reset();
        _state.gameState?.players.forEach((player) => {
            this.addPlayerCard(player.name, player.id);
        });
    }
}
