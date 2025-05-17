import { Game } from "./game/game";

declare global {
  interface Window {
    game: Game;
  }
}

(async () => {
  const game = await Game.create();
  window.game = game;
  console.log("Game instance created and attached to window");
})();
