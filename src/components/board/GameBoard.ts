import { gameManager } from "../..";
import {
    BOARD_COLUMNS,
    BOARD_ROWS,
    CELL_SEPARATOR,
    GameStateManager,
    ICellLoc,
    IPlayer,
    IShip,
    locationToKey,
    TILE_GAP_PX,
    TILE_SIZE_PX,
} from "../../../shared";
import { IAppState } from "../../types";
import { renderShipIcon } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";
import { TSetSelectableOptions } from "../Selectable";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private container = document.getElementById("gameArea") as HTMLDivElement;
    private gameBoardContainer = document.getElementById("gameBoardContainer") as HTMLDivElement;
    private tiles: Record<string, Tile> = {};

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
        this.ref.id = "gameBoard";
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
        this.ref.style.padding = "12px";
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

    private renderBoardOverlay() {
        this.gameBoardContainer = document.createElement("div");
        this.gameBoardContainer.id = "gameBoardContainer"; // TODO: move to constants
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
        gameState.players?.forEach((p) => {
            this.renderPlayerShips(p);
        });
    }

    private renderPlayerShips(player: IPlayer) {
        player.ships
            .filter((s) => s.deployed && !s.destroyed) // TEMP: we should differentiate expected destruction vs actual
            .forEach((ship) => {
                this.renderShip(ship, gameManager.firstPlayerId === player.id);
            });
    }

    private renderShip(ship: IShip, isFirstPlayer = true) {
        const tiles = ship.hullLocations?.map((hull) => {
            return { key: locationToKey(hull.location) };
        });

        tiles?.forEach(({ key }) => {
            const tile = this.tiles[key];
            renderShipIcon(tile, ship.id, ship.refNo, isFirstPlayer);

            if (gameManager.getPlayer().id === ship.playerId) {
                tile.addShipClickHandler();
            }
        });
    }
}
