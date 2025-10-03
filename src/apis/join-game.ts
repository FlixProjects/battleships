import { appConfig } from "../config/app-config";

export const joinGame = async (joinCodeInput: string) => {
  const code = joinCodeInput.trim();
  if (!code) {
    console.log("Please enter a code");
  }

  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  } catch (err) {
    console.error(err);
  }
};
