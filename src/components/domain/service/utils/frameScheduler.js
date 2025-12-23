export function createFrameScheduler(callback) {
  let frameId = null;
  const hasRAF = typeof requestAnimationFrame === "function";

  const run = () => {
    frameId = null;
    callback();
  };

  const schedule = () => {
    if (!hasRAF) {
      callback();
      return;
    }
    if (frameId !== null) return;
    frameId = requestAnimationFrame(run);
  };

  const cancel = () => {
    if (frameId === null) return;
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frameId);
    }
    frameId = null;
  };

  const flush = () => {
    if (frameId !== null) {
      cancel();
    }
    callback();
  };

  const isPending = () => frameId !== null;

  return { schedule, cancel, flush, isPending };
}
