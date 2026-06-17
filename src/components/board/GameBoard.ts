import {
    ANIMATION_LAYER_ID,
    CELL_SEPARATOR,
    COMPONENT_ID,
    GAME_BOARD_ID,
    TILE_GAP_PX,
    TILE_SIZE_PX,
    Z_INDEX
} from "@shared/constants";
import { GameState } from "@shared/models";
import { FERenderShipCommand } from "@shared/models/commands/FERenderShipCommand";
import { IAppState, ICellLoc, IShip, TGameStateManagerCtor } from "@shared/types";
import { IUpdateSelectableOptions, TSetSelectableOptions } from "@shared/types/fe-types";
import { locationToKey } from "@shared/utils";
import { gameManager } from "../..";
import { FEGameStateManager } from "../../models/FEGameStateManager";
import { queueCommand } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";
import { EffectSprite } from "./EffectSprite";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private GSM: TGameStateManagerCtor = FEGameStateManager;
    public tiles: Record<string, Tile> = {};
    public gameState: GameState;
    private boardConfig = { rows: 0, cols: 0 };

    private container = document.getElementById(COMPONENT_ID.GAME_AREA) as HTMLDivElement;
    private gameBoardContainer = document.getElementById(COMPONENT_ID.GAME_BOARD_CONTAINER) as HTMLDivElement;
    private staticLayer = document.getElementById(COMPONENT_ID.GAME_BOARD_STATIC_LAYER) as HTMLDivElement;
    private elementsCurrentlyAnimatingMap = new Map<string, string>(); // elementId to animationId (e.g. shipId)

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        this.staticLayer?.remove();
        if (_state?.gameState?.players?.length === 2) {
            this.gameState = new this.GSM(_state.gameState).gameState;
            this.boardConfig = { ...this.gameState.getBoardDimensions() };
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

        if (this.gameState) {
            const { rows, cols } = this.boardConfig;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    this.renderTile(`${col}${CELL_SEPARATOR}${row}`);
                }
            }
        }

        this.staticLayer?.remove();
        this.renderStaticLayer();

        this.renderPlayersShips();
        this.renderEffects();
        this.applyVisibility();

        this.gameBoardContainer.appendChild(this.ref);
        return this.ref;
    }

    protected addStyles(): void {
        const { cols } = this.boardConfig;
        this.ref.style.position = "relative";
        this.ref.innerHTML = "";
        this.ref.style.display = "grid";
        this.ref.style.gridTemplateColumns = `repeat(${cols}, ${TILE_SIZE_PX}px)`;
        this.ref.style.gap = `${TILE_GAP_PX}px`;
        this.ref.style.background = "rgba(255, 255, 255, 0)";
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

        const visibleTiles = new this.GSM(gameManager.state.gameState).gameState.getVisibleTilesforPlayer(playerId);
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

    private renderStaticLayer() {
        this.staticLayer = document.createElement("div");
        this.staticLayer.id = COMPONENT_ID.GAME_BOARD_STATIC_LAYER;
        this.staticLayer.style.position = "absolute";
        this.staticLayer.style.zIndex = Z_INDEX.STATIC_LAYER;

        this.gameBoardContainer.appendChild(this.staticLayer);
    }

    private renderTile(key: string) {
        const tile = new Tile({ id: key });
        this.tiles[key] = tile;
        this.addChild(tile);
        this.ref.appendChild(tile.build());
    }

    private renderPlayersShips() {
        const gameState = new this.GSM(gameManager.state.gameState).gameState;
        if (!gameState) return;
        const shipsToRender = gameState.ships?.filter((s) => s.deployed && !s.destroyed);

        shipsToRender.forEach(async (ship) => {
            await this.renderShip(ship);
        });
    }

    public async renderShip(ship: IShip) {
        if (this.elementsCurrentlyAnimatingMap.has(ship.id)) {
            return;
        }
        await queueCommand(new FERenderShipCommand(ship.id));
    }

    private renderEffects() {
        const gameState = new this.GSM(gameManager.state.gameState).gameState;
        gameState.getActiveEffects().forEach((effect) => {
            const sprite = new EffectSprite({ effect });
            this.addChild(sprite);
            this.ref.appendChild(sprite.build());
        });
    }
}
