export function createFrameScheduler(callback) {
  let frameId = null;

  const schedule = () => {
    if (typeof requestAnimationFrame !== "function") {
      callback();
      return;
    }
    if (frameId !== null) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      callback();
    });
  };

  schedule.cancel = () => {
    if (frameId === null) return;
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frameId);
    }
    frameId = null;
  };

  return schedule;
}
