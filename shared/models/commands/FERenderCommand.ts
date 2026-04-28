import { COMPONENT_ID } from "@shared/constants";
import { IGameBoard } from "@shared/types/fe-types";
import { getComponents } from "../../../src/components/component-helper";
import { FECommand } from "./FECommand";

export abstract class FERenderCommand extends FECommand {
    public parentElement = document.body;

    public get gameBoard(): IGameBoard {
        return getComponents().div.gameBoard;
    }

    public get staticLayer(): HTMLDivElement {
        return document.getElementById(COMPONENT_ID.GAME_BOARD_STATIC_LAYER) as HTMLDivElement;
    }
}
