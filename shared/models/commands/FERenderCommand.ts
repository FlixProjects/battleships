import { FECommand } from "./FECommand";
import { getComponents } from "../../../src/components/component-helper";
import { IGameBoard } from "@shared/types/fe-types";

export abstract class FERenderCommand extends FECommand {
    public parentElement = document.body;

    public get gameBoard(): IGameBoard {
        return getComponents().div.gameBoard;
    }
}
