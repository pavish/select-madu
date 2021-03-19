import type {
  CancellablePromiseExecutor,
  CancellablePromiseLike,
} from './types';

export default class CancellablePromise<T> implements CancellablePromiseLike<T> {
  #isActive: boolean;

  #promise: Promise<T>;

  #onCancel: () => void;

  #onCatch: (err: unknown) => void;

  constructor(fn: CancellablePromiseExecutor<T>, onCancel?: () => void) {
    this.#promise = new Promise<T>(fn);
    this.#isActive = true;
    this.#onCancel = onCancel;
    return this;
  }

  cancel(): void {
    this.#isActive = false;
    if (typeof this.#onCancel === 'function') {
      this.#onCancel();
    }
  }

  catch(catcher: (error: unknown) => void): void {
    this.#onCatch = catcher;
  }

  then(
    resolve?: (value: T) => void,
    reject?: (reason?: unknown) => void,
  ): CancellablePromiseLike<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.#promise.then(
      (result) => {
        if (self.#isActive && resolve) {
          resolve(result);
        }
        return result;
      },
      (err) => {
        if (self.#isActive && reject) {
          reject(err);
        }
      },
    ).catch((err) => {
      self.#onCatch(err);
    });
    return this;
  }
}
