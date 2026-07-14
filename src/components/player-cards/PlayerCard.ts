import { COLOR, COLOR_RGB_VALUE } from "@shared/constants";
import { FACTION_CONFIG } from "@shared/config/constants";
import { TFaction } from "@shared/types";
import { gameManager } from "../..";
import { BaseComponent } from "../BaseComponent";

interface Props {
    playerName: string;
    playerId: string;
    faction?: TFaction;
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

        this.addNameRow();
        this.addFaction();
        this.addStyles();

        return this.ref;
    }

    private getPlayerColor(): typeof COLOR.TEAL | typeof COLOR.ORANGE {
        if (this.props.playerId === gameManager.state.gameState.getFirstPlayerId()) {
            return COLOR.TEAL;
        }
        return COLOR.ORANGE;
    }

    /** Player-color dot + name on one line. */
    private addNameRow() {
        const rgb = COLOR_RGB_VALUE[this.getPlayerColor()];

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "center";
        row.style.gap = "8px";

        const dot = document.createElement("span");
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.borderRadius = "50%";
        dot.style.flexShrink = "0";
        dot.style.background = `rgb(${rgb})`;
        dot.style.boxShadow = `0 0 6px rgba(${rgb}, 0.8)`;

        const playerNameEl = document.createElement("span");
        playerNameEl.className = "player-name";
        playerNameEl.innerText = this.props.playerName;
        playerNameEl.style.fontWeight = "bold";
        playerNameEl.style.fontSize = "1rem";

        row.appendChild(dot);
        row.appendChild(playerNameEl);
        this.ref.appendChild(row);
    }

    private addFaction() {
        const { faction } = this.props;
        if (!faction) return;

        const factionEl = document.createElement("span");
        factionEl.className = "player-faction";
        factionEl.innerText = FACTION_CONFIG[faction]?.name ?? faction;
        factionEl.style.display = "block";
        factionEl.style.marginTop = "4px";
        factionEl.style.fontSize = "0.7rem";
        factionEl.style.letterSpacing = "0.08em";
        factionEl.style.textTransform = "uppercase";
        factionEl.style.color = "rgba(255, 255, 255, 0.55)";
        this.ref.appendChild(factionEl);
    }

    protected addStyles(): void {
        const rgb = COLOR_RGB_VALUE[this.getPlayerColor()];
        this.ref.style.borderRadius = "8px";
        this.ref.style.padding = "0.6rem 1rem";
        this.ref.style.minWidth = "120px";
        this.ref.style.textAlign = "center";
        this.ref.style.border = `1px solid rgba(${rgb}, 0.45)`;
        this.ref.style.background = `linear-gradient(180deg, rgba(${rgb}, 0.12), rgba(${rgb}, 0.03))`;
        this.ref.style.boxShadow = `0 0 12px rgba(${rgb}, 0.12)`;
    }
}
