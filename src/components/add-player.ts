export const addPlayer = (playerId: string, playerName?: string) => {
    if (!playerId) {
        return;
    }
    const playerContainer = document.createElement("div");

    playerContainer.className = "player-container";
    playerContainer.id = playerId;

    const playerNameEl = document.createElement("span");
    playerNameEl.className = "player-name";
    playerNameEl.innerText = playerName ?? "Player (Unknown)";

    const playerIdEl = document.createElement("span");
    playerIdEl.className = "player-id";
    playerIdEl.innerText = playerId;

    playerContainer.appendChild(playerNameEl);
    playerContainer.appendChild(playerIdEl);

    document.getElementById("playerList").appendChild(playerContainer);
};
