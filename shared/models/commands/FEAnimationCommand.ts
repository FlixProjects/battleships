import { getComponents } from "../../../src/components/component-helper";
import { animationManager } from "../../../src/models/AnimationManager";
import { IAnimationManager, IGameBoard } from "../../types/fe-types";
import { FECommand } from "./FECommand";

export abstract class FEAnimationCommand extends FECommand {
    protected animationManager: IAnimationManager = animationManager;
    protected get gameBoard(): IGameBoard {
        return getComponents().div.gameBoard;
    }
}
