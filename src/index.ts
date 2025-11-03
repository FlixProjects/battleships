import { addSwitchPlayerBtn } from "./components/add-switch-player";
import { appConfig } from "./config/app-config";
import { initialiseCreateGameButton, initialiseExistingGame, initialiseJoinGameButton } from "./utils/game-helper";

const token = ""; // FIXME: get from cookies
const isLocal = appConfig.deployEnv === "local";

const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;

createGameBtn.disabled = true;
joinGameBtn.disabled = true;

let playerId: string | null = null;

initialiseExistingGame();

initialiseCreateGameButton();
initialiseJoinGameButton();

if (isLocal) {
    addSwitchPlayerBtn();
}
