// eslint-disable-next-line import/no-unresolved
import type { TransitionConfig } from 'svelte/types/runtime/transition';

export interface Option {
  classes?: string | string[]
  disabled?: boolean
  [propName: string]: string | string[] | boolean | Option[]
}

export interface Formatter {
  [propName: string]: (opt: Option) => string
}

export interface Keys {
  text: string
  value: string
  child: string
}

export enum States {
  Loading = 'Loading',
  Ready = 'Ready',
  Error = 'Error'
}

export interface CancellablePromiseLike<T> {
  then: (
    resolve?: (value: T) => void,
    reject?: (reason?: unknown) => void
  ) => CancellablePromiseLike<T>
  catch: (
    catcher?: (reason?: unknown) => void
  ) => void
  cancel: () => void
}

export type CancellablePromiseExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject?: (reason?: Error) => void
) => void

export type Selected = Option | Option[] | undefined;
export type DataSource = Option[]
                        | ((searchValue?: string) => Option[])
                        | ((searchValue?: string) => Promise<Option[]>)
                        | ((searchValue?: string) => CancellablePromiseLike<Option[]>);

export interface AnimationParams {
  delay?: number
  duration?: number
}

export type TransitionFunction = (node: Element, params?: AnimationParams) => TransitionConfig;

export type Animation = boolean | {
  duration?: number
  delay?: number
  transitionFn?: TransitionFunction;
};

export interface DropdownKeyboardInteractions {
  selectHovered: () => void
  moveDown: () => void
  moveUp: () => void
}

export interface PopperModifierFunctionParam {
  state: {
    styles: {
      popper: {
        minWidth: string
      }
    },
    rects: {
      reference: {
        width: string
      }
    },
    elements: {
      popper: {
        style: {
          minWidth: string
        }
      },
      reference: {
        offsetWidth: string
      }
    }
  }
}
