import {
    ANIMATION_LAYER_ID,
    BOARD_COLUMNS,
    BOARD_ROWS,
    CELL_SEPARATOR,
    COMPONENT_ID,
    GAME_BOARD_ID,
    TILE_GAP_PX,
    TILE_SIZE_PX,
} from "@shared/constants";
import { GameStateManager } from "@shared/models";
import { FERenderShipCommand } from "@shared/models/commands/FERenderShipCommand";
import { IAppState, ICellLoc, IShip } from "@shared/types";
import { IUpdateSelectableOptions, TSetSelectableOptions } from "@shared/types/fe-types";
import { locationToKey } from "@shared/utils";
import { gameManager } from "../..";
import { queueCommand } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    public tiles: Record<string, Tile> = {};

    private container = document.getElementById(COMPONENT_ID.GAME_AREA) as HTMLDivElement;
    private gameBoardContainer = document.getElementById(COMPONENT_ID.GAME_BOARD_CONTAINER) as HTMLDivElement;
    private elementsCurrentlyAnimatingMap = new Map<string, string>(); // elementId to animationId (e.g. shipId)

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        if (_state?.gameState?.players?.length === 2) {
            this.build();
            return;
        }
    }

    build() {
        if (!this.gameBoardContainer) {
            this.renderBoardOverlay();
        }
        this.ref = document.createElement("div");
        this.ref.id = GAME_BOARD_ID;
        this.addStyles();

        for (let row = 0; row < BOARD_ROWS; row++) {
            for (let col = 0; col < BOARD_COLUMNS; col++) {
                this.renderTile(`${col}${CELL_SEPARATOR}${row}`);
            }
        }

        this.renderPlayersShips();
        this.applyVisibility();

        this.gameBoardContainer.appendChild(this.ref);

        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.position = "relative";
        this.ref.innerHTML = "";
        this.ref.style.display = "grid";
        this.ref.style.gridTemplateColumns = `repeat(${BOARD_COLUMNS}, ${TILE_SIZE_PX}px)`;
        this.ref.style.gap = `${TILE_GAP_PX}px`;
    }

    public updateSelectableTiles(validCells: [number, number][], _options?: IUpdateSelectableOptions) {
        const DEFAULT_OPTIONS: IUpdateSelectableOptions = { setAllAsUnselectableBeforeUpdate: true };
        const options = { ...DEFAULT_OPTIONS, ..._options };

        const validCellIndices = validCells.map((cell: ICellLoc) => locationToKey(cell));

        const { onSelectable, onUnselectable, setAllAsUnselectableBeforeUpdate } = options;

        const selectableOptions: TSetSelectableOptions = {
            onSelectable,
            onUnselectable,
        };

        if (setAllAsUnselectableBeforeUpdate) {
            Object.keys(this.tiles).forEach((tileIndex: string) => {
                this.tiles[tileIndex].setSelectable(false);
            });
        }

        Object.keys(this.tiles).forEach((tileIndex: string) => {
            const isValidCell = validCellIndices.includes(tileIndex);
            this.tiles[tileIndex].setSelectable(isValidCell, selectableOptions);
        });
    }

    private applyVisibility() {
        const playerId = gameManager.getCurrentPlayerId();

        if (!playerId) return;

        const visibleTiles = new GameStateManager(gameManager.state.gameState).gameState.getVisibleTilesforPlayer(
            playerId,
        );
        Object.keys(this.tiles).forEach((tileKey) => {
            this.tiles[tileKey].setVisible(visibleTiles.has(tileKey));
        });
    }

    public addToAnimatingMap(elementId: string, animationId: string) {
        this.elementsCurrentlyAnimatingMap.set(elementId, animationId);
    }

    public removeFromAnimatingMap(elementId: string) {
        this.elementsCurrentlyAnimatingMap.delete(elementId);
    }

    private renderBoardOverlay() {
        this.gameBoardContainer = document.createElement("div");
        this.gameBoardContainer.id = ANIMATION_LAYER_ID;
        this.gameBoardContainer.style.position = "relative";
        this.container.appendChild(this.gameBoardContainer);
    }

    private renderTile(key: string) {
        const tile = new Tile({ id: key });
        this.tiles[key] = tile;
        this.addChild(tile);
        this.ref.appendChild(tile.build());
    }

    private renderPlayersShips() {
        const gameState = new GameStateManager(gameManager.state.gameState).gameState;
        if (!gameState) return;
        const shipsToRender = gameState.ships?.filter((s) => s.deployed && !s.destroyed);

        shipsToRender.forEach((ship) => {
            this.renderShip(ship);
        });
    }

    public renderShip(ship: IShip) {
        if (this.elementsCurrentlyAnimatingMap.has(ship.id)) {
            return;
        }
        queueCommand(new FERenderShipCommand(ship.id));
    }
}
