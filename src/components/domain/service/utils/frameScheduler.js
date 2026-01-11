export function createFrameScheduler(callback) {
  let taskId = null;
  let pending = false;
  let token = 0;

  const scheduleTask = (runner) => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(runner);
      return null;
    }
    return setTimeout(runner, 0);
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    const runToken = token;
    taskId = scheduleTask(() => {
      if (runToken !== token) return;
      pending = false;
      taskId = null;
      callback();
    });
  };

  const cancel = () => {
    token += 1;
    if (!pending) return;
    if (taskId !== null) {
      clearTimeout(taskId);
    }
    taskId = null;
    pending = false;
  };

  const flush = () => {
    cancel();
    callback();
  };

  const isPending = () => pending;

  return { schedule, cancel, flush, isPending };
}
