<svelte:options immutable={true}/>

<script type="typescript">
  import {
    onDestroy,
    onMount,
    SvelteComponent,
    tick,
  } from 'svelte';
  import { createPopper } from '@popperjs/core/dist/esm/popper-lite';
  import type {
    Option,
    Keys,
    Selected,
    Animation,
  } from '../types';
  import { States } from '../types';
  import OptionList from './OptionList.svelte';
  import {
    getAnimation,
    getAnimationParams,
    sameWidthModifier,
    arrowDown,
    arrowUp,
    offsetTop,
    chooseHovered,
  } from '../utilities';

  export let optionComponent: SvelteComponent;
  export let options: Option[];
  export let keys: Keys;
  export let selected: Selected;
  export let parent: Element;
  export let isOpen = false;
  export let state: States;
  export let animate: Animation = false;
  export let multiple: boolean;
  export let classes: string | string[];
  export let componentId: number;

  $: parentClass = [
    'select-madu-dropdown',
    (Array.isArray(classes) ? classes.join(' ') : classes),
  ].join(' ').trim();

  let scrollParentRef: HTMLDivElement;

  function scrollToSelected(): void {
    if (scrollParentRef) {
      const element = scrollParentRef.querySelector('.hovered');
      if (element) {
        const elem = (element as HTMLElement);
        const elemOffsetTop = offsetTop(elem, scrollParentRef);
        if (
          elemOffsetTop + elem.clientHeight
          > (scrollParentRef.scrollTop + scrollParentRef.clientHeight)
        ) {
          scrollParentRef.scrollTop = elemOffsetTop;
        } else if (elemOffsetTop < scrollParentRef.scrollTop) {
          scrollParentRef.scrollTop = elemOffsetTop;
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function scrollAfterTick(_opts?: Option[]) {
    const promise: Promise<void> = tick();
    promise.then(() => scrollToSelected()).catch(() => 0);
  }

  $: scrollAfterTick(options);

  onMount(() => {
    isOpen = true;
    scrollAfterTick();
  });

  onDestroy(() => {
    isOpen = false;
  });

  function popper(node: HTMLElement) {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const popperInstance = createPopper(parent, node, {
      placement: 'bottom-start',
      modifiers: [
        sameWidthModifier,
        {
          name: 'offset',
          options: {
            offset: [0, 0],
          },
        },
      ],
    });

    return {
      destroy() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        popperInstance.destroy();
      },
    };
  }

  $: animationFn = getAnimation(animate);
  $: animationParams = getAnimationParams(animate);

  export function moveDown(): void {
    if (scrollParentRef) {
      arrowDown(scrollParentRef);
      scrollToSelected();
    }
  }

  export function moveUp(): void {
    if (scrollParentRef) {
      arrowUp(scrollParentRef);
      scrollToSelected();
    }
  }

  export function selectHovered(): void {
    if (scrollParentRef) {
      chooseHovered(scrollParentRef);
    }
  }
</script>

<div class={parentClass} use:popper
    style="box-sizing:border-box;z-index:1000;max-width:100%;"
    dir="ltr">

    {#if isOpen}
      <div bind:this={scrollParentRef} class="opt-container"
           transition:animationFn={animationParams}
           style="position:relative;max-height:194px;overflow:auto;
                  border-width:1px;border-style:solid;background:#fff;
                  margin-top:4px;">
        <ul role="listbox" aria-multiselectable="{multiple}" aria-expanded="true"
            id="select-madu-{componentId}-options"
            style="margin:0;list-style:none;padding:0;position:relative;">
            {#if options.length > 0}
              <OptionList options={options} keys={keys} optionComponent={optionComponent}
                          selected={selected} on:selection/>
            {:else}
              <li role="alert" aria-live="assertive" class="sub-text">
                {#if state === States.Loading}
                  Loading
                {:else}
                  No results found
                {/if}
              </li>
            {/if}
        </ul>
      </div>
    {/if}

</div>
