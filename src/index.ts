import { Game } from "@shared/models/Game";
import { ActionResolver } from "@shared/utils/action-handler/ActionResolver";
import { loadComponents } from "./components/component-helper";
import { App } from "./models/App";
import { FEGameStateManager } from "./models/FEGameStateManager";
import { GameManager } from "./models/GameManager";
import { InteractionManager } from "./models/interaction-manager/InteractionManager";
import { FrontendDB } from "./db";
import { JwtHelper } from "../shared/auth/jwt-helper";

export let dbObjectStore: IDBObjectStore;
export let idb: FrontendDB;

new FrontendDB()
    .start(async (db) => {
        const existingPrivateKey = await db.get("privateKey")
        const existingPublicKey = await db.get("publicKey")

        if (existingPrivateKey.value && existingPublicKey.value) {
            return;
        }

        const jwtHelper = new JwtHelper();
        const { privateKey, publicKey } = await jwtHelper.generateKeyPair();

        await db.store(privateKey, "privateKey");
        await db.store(publicKey, "publicKey");
    })
    .then((db) => (idb = db));

export const interactionManager = new InteractionManager();
export const gameManager = new GameManager(); // effectively the DB
export const _components = loadComponents();

export const app = new App();
export const game = new Game(gameManager, FEGameStateManager, ActionResolver);
app.start();
