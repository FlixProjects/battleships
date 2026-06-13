import { IGameStateManager } from "@shared/types";
import type { FEGameState } from "../models/fe-entities/FEGameState";
import type { FEShipEntity } from "../models/fe-entities/FEShipEntity";

export interface IFEGameStateManager extends IGameStateManager {
    get gameState(): FEGameState;
    getShip(shipId: string): FEShipEntity;
}
