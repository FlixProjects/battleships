import { FP_GAME_STATE } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IPlainGameState } from "@shared/types";
import { generateGameCode } from "@shared/utils";
import { GameStateBuilder } from "@shared/utils/builder/GameStateBuilder";
import { v7 as uuidv7 } from "uuid";
import { gameManager } from "..";
import { isLocal } from "../config/app-config";
import { setGameCode } from "../utils/game-helper";
import { updateComponents } from "./component-helper";
import { HTMLButton } from "./native/Button";

export class ResetLocalGameButton extends HTMLButton {
    constructor() {
        super();
        if (isLocal) {
            this.build();
        }
    }

    public build(): HTMLElement {
        const hasExisting = document.getElementById("resetLocalGameButtonContainer");

        if (hasExisting) {
            return;
        }

        const resetLocalGameButtonContainer = document.createElement("div");
        resetLocalGameButtonContainer.id = "resetLocalGameButtonContainer";

        const resetLocalGameButton = document.createElement("button");
        this.ref = resetLocalGameButton;

        resetLocalGameButton.id = "resetLocalGameBtn";
        resetLocalGameButton.innerText = "Reset";
        resetLocalGameButton.className = "btn secondary";

        this.addClickEventListener();

        resetLocalGameButtonContainer.appendChild(resetLocalGameButton);
        document.getElementById("controls").appendChild(resetLocalGameButtonContainer);

        return this.ref;
    }

    public remove() {
        document.getElementById("resetLocalGameButtonContainer")?.remove();
    }

    // FIXME: to fix later, low priority since this is only for local testing
    private initializeTwoPlayers() {
        gameManager.clearPlayerStates(); // clear memory

        const player1Name = "player1";
        const player2Name = "player2";

        const gameCode = generateGameCode();
        const player1Id = uuidv7();
        const player2Id = uuidv7();

        const builder = new GameStateBuilder().loadCode(gameCode).loadMap();
        this.loadPlayer(builder, { id: player1Id, name: player1Name, order: 0 });
        const player1GameState: IPlainGameState = builder.build({ initiative: player1Id });

        // sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(initialGameState));

        setGameCode(gameCode);
        gameManager.setCurrentPlayer(player1Id);

        gameManager.saveAppState({
            status: GameConfig.AppStatus.Initialised,
            loading: false,
            gameState: player1GameState,
        });

        this.loadPlayer(builder, { id: player2Id, name: player2Name, order: 1 });
        const initialGameState: IPlainGameState = builder.build({
            initiative: player1Id,
            currentRound: player1GameState.currentRound + 1,
        });

        sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(initialGameState));

        gameManager.setCurrentPlayer(player2Id);
        gameManager.saveAppState({
            status: GameConfig.AppStatus.Initialised,
            loading: false,
            gameState: initialGameState,
        });

        setGameCode(gameCode);
        updateComponents();
    }

    private loadPlayer(builder: GameStateBuilder, player: { id: string; name: string; order: number }) {
        builder
            .loadEmptyNewPlayer(player)
            .loadFaction(GameConfig.Faction.THE_UNITED_DEFENSE_FLEET)
            .loadDeck()
            .loadCards()
            .loadShips()
            .loadHand(Math.random);
    }

    async onClick() {
        gameManager.resetGame();
    }
}
