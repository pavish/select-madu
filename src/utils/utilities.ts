import type { DataSource, Keys, Option, Animation } from '../interfaces';
import { CancellablePromise } from './CancellablePromise';

export const closest = (elem: EventTarget, refelem: HTMLElement): HTMLElement | null => {
  let parentElem = elem as HTMLElement;
  while (parentElem !== refelem) {
    parentElem = parentElem.parentElement;
    if (!parentElem) {
      return null;
    }
  }
  return parentElem;
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

function transform (
  node, { delay = 0, duration = 100, baseScale = 0.75 }
) {
  const is = 1 - baseScale;

  return {
    delay,
    duration,
    css: t => {
      const translate = (t - 1) * 10;
      return `opacity: ${t}; transform-origin: 60% 0;
              transform: scale(${(t * is) + baseScale}) translateY(${translate}px);
              transition: all .1s cubic-bezier(0.5, 0, 0, 1.25), opacity .15s ease-out`;
    }
  };
};

export const getAnimation = (_animate: Animation) => {
  if (typeof _animate === 'boolean') {
    return _animate ? transform : () => ({ delay: 0, duration: 0 });
  } else if (_animate.transitionFn) {
    return _animate.transitionFn;
  }
  return transform;
};

export const getAnimationParams = (_animate: Animation) => {
  let delay = 0, duration = 100;
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
  fn: (obj) => {
    // eslint-disable-next-line no-param-reassign
    obj.state.styles.popper.minWidth = `${obj.state.rects.reference.width as string}px`;
  },
  effect: (obj) => {
    // eslint-disable-next-line no-param-reassign
    obj.state.elements.popper.style.minWidth = `${
      obj.state.elements.reference.offsetWidth as string
    }px`;
  },
};

function getHovered(scrollParentRef) {
  let hoveredElem = scrollParentRef.querySelector('li.o.hovered');
  if (!hoveredElem) {
    hoveredElem = scrollParentRef.querySelector('li.o');
  }
  return hoveredElem;
}

export const arrowDown = (scrollParentRef) => {
  const elem = getHovered(scrollParentRef);
  if (elem) {
    let nextElem;

    if (elem.classList.contains('hovered')) {
      const nodeList = scrollParentRef.querySelectorAll('li.o');
      if (nodeList.length > 0) {
        let index = 0;
        for (let i = 0; i < nodeList.length; i++) {
          if (nodeList[i].classList.contains('hovered')) {
            if (i < nodeList.length - 1) {
              index = i + 1;
            }
            break;
          }
        }
        nextElem = nodeList[index];
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

export const arrowUp = (scrollParentRef) => {
  const elem = getHovered(scrollParentRef);
  if (elem) {
    let prevElem;

    const nodeList = scrollParentRef.querySelectorAll('li.o');
    if (nodeList.length > 0) {
      if (elem.classList.contains('hovered')) {
        let index = nodeList.length - 1;
        for (let i = nodeList.length - 1; i >= 0; i--) {
          if (nodeList[i].classList.contains('hovered')) {
            if (i > 0) {
              index = i - 1;
            }
            break;
          }
        }
        prevElem = nodeList[index];
        elem.classList.remove('hovered');
      } else {
        prevElem = nodeList[nodeList.length - 1];
      }
    }

    if (prevElem) {
      prevElem.classList.add('hovered');
    }
  }
};

export const chooseHovered = (scrollParentRef) => {
  const hoveredElem = scrollParentRef.querySelector('li.o.hovered');
  if (hoveredElem) {
    // TODO: Change to custom event
    hoveredElem.click();
  } else {
    arrowDown(scrollParentRef);
  }
};

export const subTree = (tree: Option[], childKey: string, conditionFn: ((element: Option) => boolean)) => {
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
}

export const stringContains = (actualString: string, searchVal: string) => {
  return actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;
}

export const filterTree = (tree: Option[], keys: { child: string, text: string }, searchVal: string) => {
  return subTree(tree, keys.child, (el) => {
    const text = el[keys.text];
    if (typeof text === 'string') {
      return stringContains(text, searchVal);
    } else {
      return false;
    }
  });
}

export const fetchOptions = (datasource: DataSource, searchVal: string, keys: Keys) => {
  if (datasource) {
    if (typeof datasource === 'function') {
      const fetchResult = datasource(searchVal);
      if (Array.isArray(fetchResult)) {
        return new CancellablePromise<Option[]>((resolve) => {
          resolve(fetchResult);
        });
      } else if (typeof fetchResult.then === 'function') {
        return new CancellablePromise<Option[]>(
          (resolve, reject) => {
            fetchResult.then(
              (res: Option[]) => {
                resolve(res);
              },
              (err) => {
                reject(err);
              },
            ).catch?.((err) => {
              reject(err);
            })
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
