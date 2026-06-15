import type { IActionResolver, IGameManager } from "@shared/types";
import type { IFEGameStateManager } from "../types";

export interface IFECommandExecutionParams {
    currentPlayerId: string;
    gsm: IFEGameStateManager;
    db: IGameManager;
    resolver: IActionResolver;
}
