import { BaseComponent } from "../BaseComponent";

interface Props {
    playerName: string;
    playerId: string;
}

const DEFAULT_PROPS: Props = {
    playerName: "Player (Unknown)",
    playerId: "",
};

export class PlayerCard extends BaseComponent {
    constructor(public props: Props = DEFAULT_PROPS) {
        super();
        this.build();
    }

    build() {
        const { playerId } = this.props;

        this.ref = document.createElement("div");

        this.ref.className = "player-container";
        this.ref.id = playerId;

        this.addPlayerName();
        this.addPlayerId();
    }

    addPlayerName() {
        const { playerName } = this.props;
        const playerNameEl = document.createElement("span");
        playerNameEl.className = "player-name";
        playerNameEl.innerText = playerName;
        this.ref.appendChild(playerNameEl);
    }

    addPlayerId() {
        const { playerId } = this.props;
        const playerIdEl = document.createElement("span");
        playerIdEl.className = "player-id";
        playerIdEl.innerText = playerId;
        this.ref.appendChild(playerIdEl);
    }
}
