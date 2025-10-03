import { appConfig } from "../config/app-config";

interface Coordinate {
  x: number;
  y: number;
}

async function submitMove(
  coord: Coordinate,
  gameCode: string,
  playerId: string
) {
  if (!gameCode || !playerId) return;

  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: gameCode, playerId, coord }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}
