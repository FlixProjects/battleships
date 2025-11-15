import { loadComponents } from "./components/component-helper";
import { App } from "./models/App";
import { GameEngine } from "./models/GameEngine";
import { GameManager } from "./models/GameManager";
import { InteractionManager } from "./models/InteractionManager";

export const gameEngine = new GameEngine();
export const interactionManager = new InteractionManager();
export const gameManager = new GameManager();
export const _components = loadComponents();

export const app = new App();

app.start()