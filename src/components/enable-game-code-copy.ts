export function enableGameCodeCopy() {
  const gameCodeEl = document.getElementById("gameCode");

  if (!gameCodeEl) return;

  gameCodeEl.addEventListener("click", async () => {
    const code = gameCodeEl.textContent?.trim();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);

      // Temporary visual feedback
      const original = gameCodeEl.textContent;
      gameCodeEl.textContent = "✅ Copied!";
      gameCodeEl.classList.add("copied");

      setTimeout(() => {
        gameCodeEl.textContent = original!;
        gameCodeEl.classList.remove("copied");
      }, 1200);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  });
}