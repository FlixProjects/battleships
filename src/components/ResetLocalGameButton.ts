import { FP_GAME_STATE } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IPlainGameState } from "@shared/types";
import {
    applyStartingStateToPlayer,
    buildPlayerStartingState,
    createNewGameState,
    generateGameCode,
    initialiseNewPlayer,
} from "@shared/utils";
import { v7 as uuidv7 } from "uuid";
import { gameManager } from "..";
import { isLocal } from "../config/app-config";
import { setCurrentPlayer, setGameCode } from "../utils/game-helper";
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

    private async resetLocalGame() {
        await sessionStorage.clear();
    }

    // FIXME: to fix later, low priority since this is only for local testing
    private initializeTwoPlayers() {
        gameManager.clearPlayerStates(); // clear memory

        const player1Name = "player1";
        const player2Name = "player2";

        const gameCode = generateGameCode();
        const player1Id = uuidv7();
        const player2Id = uuidv7();

        const initialGameState: IPlainGameState = createNewGameState(gameCode, player1Id, player1Name);

        // sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(initialGameState));

        setGameCode(gameCode);
        setCurrentPlayer(player1Id);

        gameManager.saveAppState({ status: GameConfig.AppStatus.Initialised, loading: false, gameState: initialGameState });

        const player2 = initialiseNewPlayer({ id: player2Id, name: player2Name, order: 1 });
        const player2Starting = buildPlayerStartingState(player2Id, GameConfig.Faction.THE_UNITED_FLEET);
        applyStartingStateToPlayer(player2, player2Starting);

        initialGameState.ships.push(...player2Starting.ships);
        initialGameState.cards.push(...player2Starting.cards);
        initialGameState.decks.push(player2Starting.deck);
        initialGameState.players.push(player2);
        initialGameState.currentRound++;

        sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(initialGameState));

        gameManager.setCurrentPlayer(player2Id);
        gameManager.saveAppState({ status: GameConfig.AppStatus.Initialised, loading: false, gameState: initialGameState });
        
        setGameCode(gameCode);
        updateComponents();
    }

    async onClick() {
        await this.resetLocalGame();
        // await this.initializeTwoPlayers();
        await location.reload();
    }
}
