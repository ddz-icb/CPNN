import { timer } from "d3-timer";

export function createFrameScheduler(callback) {
  let pending = false;
  let token = 0;
  let timerRef = null;

  const stopTimer = () => {
    if (timerRef) {
      timerRef.stop();
      timerRef = null;
    }
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    const runToken = token;

    stopTimer();
    timerRef = timer(() => {
      if (runToken !== token) {
        stopTimer();
        return;
      }
      pending = false;
      stopTimer();
      callback();
    });
  };

  const cancel = () => {
    token += 1;
    stopTimer();
    pending = false;
  };

  const flush = () => {
    cancel();
    callback();
  };

  const isPending = () => pending;

  return { schedule, cancel, flush, isPending };
}
