import confetti from 'canvas-confetti';

export const fireWinConfetti = (amount: number) => {
  // Fire multiple bursts of confetti
  const count = 3;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    shapes: ['square', 'circle'],
    colors: ['#FFD700', '#FFA500', '#FF4500', '#9370DB', '#00FF00']
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      particleCount: Math.floor(200 * particleRatio),
      ...opts,
    });
  };

  // Stagger the confetti bursts
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      fire(0.25, {
        origin: { y: 0.7 },
        angle: 120,
      });
      fire(0.25, {
        origin: { y: 0.7 },
        angle: 60,
      });
      fire(0.35, {
        origin: { y: 0.7 },
        angle: 90,
      });
    }, i * 200);
  }
}