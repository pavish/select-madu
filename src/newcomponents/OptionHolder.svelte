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
  } from '../interfaces';
  import { States } from '../interfaces';
  import OptionList from './OptionList.svelte';
  import {
    getAnimation,
    getAnimationParams,
    sameWidthModifier,
  } from '../utils/GeneralUtils';

  export let optionComponent: SvelteComponent;
  export let options: Option[];
  export let keys: Keys;
  export let selected: Selected;
  export let parent: Element;
  export let isOpen = false;
  export let state: States;
  export let animate: Animation = false;

  let scrollParentRef: HTMLDivElement;

  function scrollToSelected(): void {
    if (scrollParentRef) {
      const element = scrollParentRef.querySelector('.selected');
      if (element) {
        const elem = (element as HTMLElement);
        if (
          elem.offsetTop + elem.clientHeight
          > (scrollParentRef.scrollTop + scrollParentRef.clientHeight)
        ) {
          scrollParentRef.scrollTop = elem.offsetTop;
        } else if (elem.offsetTop < scrollParentRef.scrollTop) {
          scrollParentRef.scrollTop = elem.offsetTop;
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onOptionsChange(_opts?: Option[]) {
    const promise: Promise<void> = tick();
    promise.then(() => scrollToSelected()).catch(() => 0);
  }

  $: onOptionsChange(options);

  onMount(() => {
    isOpen = true;
    onOptionsChange();
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
</script>

<div class="slmd-dropdown" use:popper
    style="box-sizing:border-box;z-index:1000;max-width:100%;">

    {#if isOpen}
      <div bind:this={scrollParentRef} class="opt-container"
           transition:animationFn={animationParams}
           style="position:relative;max-height: 194px;overflow:auto;
                  border-width:1px;border-style:solid;background:#fff;
                  margin-top:4px;">
        {#if options.length > 0}
          <ul role="listbox" aria-multiselectable="true" aria-expanded="true"
              style="margin:0;list-style:none;padding:0">
            <OptionList options={options} keys={keys} optionComponent={optionComponent}
                        selected={selected} on:selection/>
          </ul>
        {:else}
          <div class="sub-text">
            {#if state === States.Loading}
              Loading
            {:else}
              No results found
            {/if}
          </div>
        {/if}
      </div>
    {/if}

</div>
