import { Game } from "@shared/models/Game";
import { ActionResolver } from "@shared/utils/action-handler/ActionResolver";
import { loadComponents } from "./components/component-helper";
import { App } from "./models/App";
import { FEGameStateManager } from "./models/FEGameStateManager";
import { GameManager } from "./models/GameManager";
import { InteractionManager } from "./models/interaction-manager/InteractionManager";

export const interactionManager = new InteractionManager();
export const gameManager = new GameManager(); // effectively the DB
export const _components = loadComponents();

export const app = new App();
export const game = new Game(gameManager, FEGameStateManager, ActionResolver);
app.start();
