import { appConfig } from "../config/app-config";

export async function sendReady(
  ships: number[][],
  gameCode: string,
  playerId: string
) {
  if (!gameCode || !playerId) return;

  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: gameCode, playerId, ships }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}
