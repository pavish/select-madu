import type { Animation } from '../interfaces';

export const closest = (elem: EventTarget, refelem: Node): Node | null => {
  let parentElem = elem as Node;
  while (parentElem !== refelem) {
    parentElem = parentElem.parentNode;
    if (!parentElem) {
      return null;
    }
  }
  return parentElem;
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
