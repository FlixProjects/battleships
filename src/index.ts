const API_BASE = process.env.BASE_API_URL;

const statusEl = document.getElementById("status") as HTMLDivElement;
const gameAreaEl = document.getElementById("gameArea") as HTMLDivElement;
const createBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
const joinBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

let gameCode: string | null = null;
let playerId: string | null = null;

function updateStatus(msg: string) {
  statusEl.innerText = msg;
}

createBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/create`, { method: "POST" });
    const data = await res.json();
    gameCode = data.code;
    playerId = data.playerId;
    updateStatus(`Game created! Code: ${gameCode}`);
  } catch (err) {
    console.error(err);
    updateStatus("Failed to create game.");
  }
});


joinBtn.addEventListener("click", async () => {
  const code = joinCodeInput.value.trim();
  if (!code) return updateStatus("Enter a code to join.");

  try {
    const res = await fetch(`${API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    gameCode = code;
    playerId = data.playerId;
    updateStatus(`Joined game ${code} as ${playerId}`);
  } catch (err) {
    console.error(err);
    updateStatus("Failed to join game.");
  }
});


async function sendReady(ships: number[][]) {
  if (!gameCode || !playerId) return;

  try {
    const res = await fetch(`${API_BASE}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: gameCode, playerId, ships }),
    });
    const data = await res.json();
    updateStatus(`You are ready! Game state: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(err);
    updateStatus("Failed to send ReadyCommand.");
  }
}


async function submitMove(x: number, y: number) {
  if (!gameCode || !playerId) return;

  try {
    const res = await fetch(`${API_BASE}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: gameCode, playerId, move: { x, y } }),
    });
    const data = await res.json();
    updateStatus(`Move submitted. New state: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(err);
    updateStatus("Failed to submit move.");
  }
}
