import { loadComponents } from "./components/component-helper";
import { App } from "./models/App";
import { GameManager } from "./models/GameManager";
import { InteractionManager } from "./models/interaction-manager/InteractionManager";

export const interactionManager = new InteractionManager();
export const gameManager = new GameManager(); // effectively the DB
export const _components = loadComponents();

export const app = new App();

app.start();
