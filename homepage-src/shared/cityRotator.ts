export const rotatorTitles = [
  { top: "Caxias", bottom: "do Sul", full: "Caxias do Sul" },
  { top: "Bento", bottom: "Gonçalves", full: "Bento Gonçalves" },
  { top: "Passo", bottom: "Fundo", full: "Passo Fundo" },
] as const;

export const rotatorAutoplayDuration = 3000;

export function getNextRotatorIndex(currentIndex: number, itemCount = rotatorTitles.length) {
  return (currentIndex + 1) % itemCount;
}

export function isRotatorAutoplayActive(isPaused: boolean) {
  return !isPaused;
}
