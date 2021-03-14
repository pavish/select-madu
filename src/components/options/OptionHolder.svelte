<svelte:options immutable={true}/>

<script type="typescript">
  import { onMount, SvelteComponent, tick } from 'svelte';
  import Options from './OptionList.svelte';

  import type { Option } from '../../interfaces';

  export let options: Option[] = [];
  export let optionComponent: SvelteComponent;

  export let childKey = 'id';
  export let totalCount = 0;

  export let getFormatted;
  export let isSelected: (opt: any) => boolean = function () {
    return false;
  };

  let scrollParentRef;

  $: onOptionsChange(options);

  onMount(() => {
    scrollToSelected();
  });

  export function moveUp() {
    const elem = getHovered();
    if (elem) {
      let prevElem;

      const nodeList = scrollParentRef.querySelectorAll('li.o');
      if (nodeList.length > 0) {
        if (elem.classList.contains('selected')) {
          let index = nodeList.length - 1;
          for (let i = nodeList.length - 1; i >= 0; i--) {
            if (nodeList[i].classList.contains('selected')) {
              if (i > 0) {
                index = i - 1;
              }
              break;
            }
          }
          prevElem = nodeList[index];
          elem.classList.remove('selected');
        } else {
          prevElem = nodeList[nodeList.length - 1];
        }
      }

      if (prevElem) {
        prevElem.classList.add('selected');
      }
    }
    scrollToSelected();
  }

  export function moveDown() {
    const elem = getHovered();
    if (elem) {
      let nextElem;

      if (elem.classList.contains('selected')) {
        const nodeList = scrollParentRef.querySelectorAll('li.o');
        if (nodeList.length > 0) {
          let index = 0;
          for (let i = 0; i < nodeList.length; i++) {
            if (nodeList[i].classList.contains('selected')) {
              if (i < nodeList.length - 1) {
                index = i + 1;
              }
              break;
            }
          }
          nextElem = nodeList[index];
        }
        elem.classList.remove('selected');
      } else {
        nextElem = elem;
      }

      if (nextElem) {
        nextElem.classList.add('selected');
      }
    }
    scrollToSelected();
  }

  export function selectFocused() {
    const elem = scrollParentRef.querySelector('.selected');
    if (elem) {
      elem.click();
      return true;
    }
    return false;
  }

  export function clearSelected() {
    const elem = getHovered();
    if (elem && elem.classList.contains('selected')) {
      elem.classList.remove('selected');
    }
  }

  function onOptionsChange(opts) {
    tick().then(() => {
      scrollToSelected();
    });
  }

  function getHovered() {
    let hoveredElem = scrollParentRef.querySelector('li.o.selected');
    if (!hoveredElem) {
      hoveredElem = scrollParentRef.querySelector('li.o');
    }
    return hoveredElem;
  }

  function scrollToSelected() {
    const elem = scrollParentRef.querySelector('.selected');
    if (elem) {
      if (elem.offsetTop + elem.clientHeight > (scrollParentRef.scrollTop + scrollParentRef.clientHeight)) {
        scrollParentRef.scrollTop = elem.offsetTop;
      } else if (elem.offsetTop < scrollParentRef.scrollTop) {
        scrollParentRef.scrollTop = elem.offsetTop;
      }
    }
    return elem;
  }
</script>

<div class="slmd-dropdown">
  <div bind:this={scrollParentRef} class="opt-container">
    <Options options={options} childKey={childKey}
             getFormatted={getFormatted}
             on:selection isSelected={isSelected} optionComponent={optionComponent}/>
  </div>
  
  {#if totalCount === 0}
    <div class="sub-text">
      No results found
    </div>
  
  {:else if (typeof totalCount !== 'undefined') && (totalCount !== options.length)}
    <div class="sub-text">
      showing {options.length} of {totalCount}
    </div>
  {/if}
</div>
