import { gameManager } from "../..";
import {
    ANIMATION_LAYER_ID,
    BOARD_COLUMNS,
    BOARD_ROWS,
    CELL_SEPARATOR,
    GAME_BOARD_ID,
    GameStateManager,
    IAppState,
    ICellLoc,
    IHull,
    IShip,
    locationToKey,
    TILE_GAP_PX,
    TILE_SIZE_PX,
} from "../../../shared";
import { renderShipIconV2 } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";
import { TSetSelectableOptions } from "../Selectable";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private container = document.getElementById("gameArea") as HTMLDivElement;
    private gameBoardContainer = document.getElementById("gameBoardContainer") as HTMLDivElement;
    private tiles: Record<string, Tile> = {};
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

    public updateSelectableTiles(validCells: [number, number][], options?: TSetSelectableOptions) {
        const validCellIndices = validCells.map((cell: ICellLoc) => locationToKey(cell));
        Object.keys(this.tiles).forEach((tileIndex: string) => {
            const isValidCell = validCellIndices.includes(tileIndex);
            this.tiles[tileIndex].setSelectable(isValidCell, options);
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
            const hulls = gameState.hulls.filter((h) => h.shipId === ship.id);
            this.renderShip(ship, hulls, gameState.getFirstPlayerId() === ship.playerId);
        });
    }

    public renderShip(ship: IShip, hulls: IHull[], isFirstPlayer = true) {
        if (this.elementsCurrentlyAnimatingMap.has(ship.id)) {
            return;
        }
        const tiles = hulls?.map((hull) => {
            return { key: locationToKey(hull.location) };
        });

        tiles?.forEach(({ key }, i) => {
            const tile = this.tiles[key];
            // TODO: we might need to handle Ships with multiple hull locations
            const shipProps = { id: ship.id, playerId: ship.playerId, refNo: ship.refNo, hulls: ship.hulls };

            renderShipIconV2(tile, shipProps, isFirstPlayer);
        });
    }
}
