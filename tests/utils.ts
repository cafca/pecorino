export const isGameReady = () => {
  // Check if game container exists
  // eslint-disable-next-line no-undef
  const container = document.getElementById("game-container");
  if (!container) return false;

  // Check if canvas exists and is visible
  const canvas = container.querySelector("canvas");
  if (!canvas || !canvas.isConnected) return false;

  // Check if game instance exists and is initialized
  // @ts-expect-error window.game is not typed
  // eslint-disable-next-line no-undef
  const game = window.game;
  if (!game) return false;

  // Check if game has a player ant
  const position = game.getPlayerPosition();
  return (
    position !== undefined &&
    position.x !== undefined &&
    position.y !== undefined
  );
};
