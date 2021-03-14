import type {
  CancellablePromiseExecutor,
  CancellablePromiseLike,
} from "../interfaces";

export class CancellablePromise<T> implements CancellablePromiseLike<T> {
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

  cancel(): CancellablePromiseLike<T> {
    this.#isActive = false;
    if (typeof this.#onCancel === 'function') {
      this.#onCancel();
    }
    return this;
  }

  catch(catcher: (error: unknown) => void): void {
    this.#onCatch = catcher;
  }

  then(resolve?: (value: T) => void, reject?: (reason?: unknown) => void): CancellablePromiseLike<T> {
    const self = this;
    this.#promise.then(
      (result) => {
        if (self.#isActive && resolve) {
          resolve(result);
        }
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
