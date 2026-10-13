import { env } from '../../config/env.js';

export function withTimeout(promise, ms = env.CURSOR_RUN_TIMEOUT_MS, code = 'CURSOR_TIMEOUT') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function esperarRunConTimeout(run) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(async () => {
      try {
        if (run.supports?.('cancel')) {
          await run.cancel();
        }
      } catch {
        /* ignore */
      }
      reject(new Error('CURSOR_RUN_TIMEOUT'));
    }, env.CURSOR_RUN_TIMEOUT_MS);

    run
      .wait()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
