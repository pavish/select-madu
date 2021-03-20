// eslint-disable-next-line import/no-unresolved
import type { TransitionConfig } from 'svelte/types/runtime/transition';
import type {
  DataSource,
  Keys,
  Option,
  Animation,
  AnimationParams,
  TransitionFunction,
  PopperModifierFunctionParam,
} from './types';
import CancellablePromise from './CancellablePromise';

export const isOutOfBounds = (
  elem: HTMLElement,
  refElem: HTMLElement,
  componentId: number,
): boolean => {
  const subString = `select-madu-${componentId}`;
  let parentElem = elem;
  while (parentElem !== refElem) {
    if (parentElem.id && parentElem.id.indexOf(subString) > -1) {
      return false;
    }
    parentElem = parentElem.parentElement;
    if (!parentElem) {
      return true;
    }
  }
  return (parentElem !== refElem);
};

export const offsetTop = (elem: HTMLElement, parentRefElem: HTMLElement): number => {
  let parentElem = elem.parentElement;
  let offset = elem.offsetTop;
  while (parentElem && parentElem !== parentRefElem) {
    offset += parentElem.offsetTop;
    parentElem = parentElem.parentElement;
  }
  return offset;
};

const transform = (
  node, { delay = 0, duration = 100, baseScale = 0.75 },
): TransitionConfig => {
  const is = 1 - baseScale;

  return {
    delay,
    duration,
    css: (t: number) => {
      const translate = (t - 1) * 10;
      return `opacity: ${t}; transform-origin: 60% 0;
              transform: scale(${(t * is) + baseScale}) translateY(${translate}px);
              transition: all .1s cubic-bezier(0.5, 0, 0, 1.25), opacity .15s ease-out`;
    },
  };
};

export const getAnimation = (_animate: Animation) : TransitionFunction => {
  if (typeof _animate === 'boolean') {
    return _animate ? transform : () => ({ delay: 0, duration: 0 });
  }
  if (_animate.transitionFn) {
    return _animate.transitionFn;
  }
  return transform;
};

export const getAnimationParams = (_animate: Animation): AnimationParams => {
  let delay = 0;
  let duration = 100;
  if (typeof _animate !== 'boolean') {
    delay = _animate.delay || 0;
    duration = typeof _animate.duration === 'number'
      ? _animate.duration
      : 100;
  }
  return { delay, duration };
};

export const sameWidthModifier = {
  name: 'sameWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn: (obj: PopperModifierFunctionParam): void => {
    // eslint-disable-next-line no-param-reassign
    obj.state.styles.popper.minWidth = `${obj.state.rects.reference.width}px`;
  },
  effect: (obj: PopperModifierFunctionParam): void => {
    // eslint-disable-next-line no-param-reassign
    obj.state.elements.popper.style.minWidth = `${
      obj.state.elements.reference.offsetWidth
    }px`;
  },
};

function getHovered(scrollParentRef: HTMLElement): HTMLElement {
  let hoveredElem = scrollParentRef.querySelector('li.o.hovered:not(.disabled)');
  if (!hoveredElem) {
    hoveredElem = scrollParentRef.querySelector('li.o:not(.disabled)');
  }
  return hoveredElem as HTMLElement;
}

export const arrowDown = (scrollParentRef: HTMLElement): void => {
  const elem = getHovered(scrollParentRef);
  if (elem) {
    let nextElem: HTMLElement;

    if (elem.classList.contains('hovered')) {
      const nodeList = scrollParentRef.querySelectorAll('li.o:not(.disabled)');
      if (nodeList.length > 0) {
        let index = 0;
        for (let i = 0; i < nodeList.length; i += 1) {
          if (nodeList[i].classList.contains('hovered')) {
            if (i < nodeList.length - 1) {
              index = i + 1;
            }
            break;
          }
        }
        nextElem = nodeList[index] as HTMLElement;
      }
      elem.classList.remove('hovered');
    } else {
      nextElem = elem;
    }

    if (nextElem) {
      nextElem.classList.add('hovered');
    }
  }
};

export const arrowUp = (scrollParentRef: HTMLElement): void => {
  const elem = getHovered(scrollParentRef);
  if (elem) {
    let prevElem: HTMLElement;

    const nodeList = scrollParentRef.querySelectorAll('li.o:not(.disabled)');
    if (nodeList.length > 0) {
      if (elem.classList.contains('hovered')) {
        let index = nodeList.length - 1;
        for (let i = nodeList.length - 1; i >= 0; i -= 1) {
          if (nodeList[i].classList.contains('hovered')) {
            if (i > 0) {
              index = i - 1;
            }
            break;
          }
        }
        prevElem = nodeList[index] as HTMLElement;
        elem.classList.remove('hovered');
      } else {
        prevElem = nodeList[nodeList.length - 1] as HTMLElement;
      }
    }

    if (prevElem) {
      prevElem.classList.add('hovered');
    }
  }
};

export const chooseHovered = (scrollParentRef: HTMLElement): void => {
  const hoveredElem = scrollParentRef.querySelector('li.o.hovered:not(.disabled)');
  if (hoveredElem) {
    // TODO: Change to custom event
    const helem = hoveredElem as HTMLElement;
    helem.click();
  } else {
    arrowDown(scrollParentRef);
  }
};

export const subTree = (
  tree: Option[],
  childKey: string,
  conditionFn: ((element: Option) => boolean),
): Option[] => {
  const stree: Option[] = [];
  tree.forEach((elem) => {
    if (elem[childKey]) {
      const childSubTree = subTree(elem[childKey] as Option[], childKey, conditionFn);
      if (childSubTree.length > 0) {
        stree.push(
          { ...elem, [childKey]: childSubTree },
        );
      }
    } else if (conditionFn(elem)) {
      stree.push(elem);
    }
  });
  return stree;
};

export const stringContains = (
  actualString: string,
  searchVal: string,
): boolean => actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;

export const filterTree = (
  tree: Option[],
  keys: { child: string, text: string },
  searchVal: string,
): Option[] => subTree(tree, keys.child, (el) => {
  const text = el[keys.text];
  if (typeof text === 'string') {
    return stringContains(text, searchVal);
  }
  return false;
});

export const fetchOptions = (
  datasource: DataSource,
  searchVal: string,
  keys: Keys,
): CancellablePromise<Option[]> => {
  if (datasource) {
    if (typeof datasource === 'function') {
      const fetchResult = datasource(searchVal);
      if (Array.isArray(fetchResult)) {
        return new CancellablePromise<Option[]>((resolve) => {
          resolve(fetchResult);
        });
      }
      if (typeof fetchResult.then === 'function') {
        return new CancellablePromise<Option[]>(
          (resolve, reject) => {
            fetchResult.then(
              (res: Option[]) => {
                resolve(res);
                return res;
              },
              (err) => {
                reject(err);
              },
            ).catch?.((err) => {
              reject(err);
            });
          },
          () => {
            if ('cancel' in fetchResult && typeof fetchResult.cancel === 'function') {
              fetchResult.cancel();
            }
          },
        );
      }
    } else {
      const result = filterTree(datasource, keys, searchVal);
      return new CancellablePromise<Option[]>((resolve) => {
        resolve(result);
      });
    }
  }

  return new CancellablePromise<Option[]>((_resolve, reject) => {
    reject(new Error('select-madu datasource is empty'));
  });
};

export const setAttribute = (
  node: HTMLElement,
  parameters: { key: string, value?: string },
): {
    destroy: () => void,
    update: (
      parameters: { key: string, value?: string }
    ) => void,
  } => {
  if (parameters.value) {
    node.setAttribute(parameters.key, parameters.value);
  } else {
    node.removeAttribute(parameters.key);
  }

  return {
    update(params) {
      if (params.value) {
        node.setAttribute(params.key, params.value);
      } else {
        node.removeAttribute(params.key);
      }
    },

    destroy() {
      node.removeAttribute(parameters.key);
    },
  };
};
