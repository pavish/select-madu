<svelte:options immutable={true}/>

<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import Options from './options.svelte';
  import getFormattedFn from './../getFormatted.js';

  const dispatch = createEventDispatcher();

  export let options = [];
  export let optionComponent;

  export let textKey = "name";
  export let childKey = "id";
  export let totalCount;

  export let getFormatted = function(type, opt) {
    return getFormattedFn(undefined, type, opt, textKey);
  };
  export let isSelected = function() {
    return false;
  };

  let scrollParentRef;

  $: onOptionsChange(options);

  onMount(() => {
    scrollToSelected();
  });

  export function moveUp() {
    let elem = getHovered();
    if(elem) {
      let prevElem;

      if(elem.classList.contains("selected")) {
        elem.classList.remove("selected");
        prevElem = jQuery(elem).prev();
      }
      else {
        prevElem = jQuery(elem);
      }

      if(prevElem.length === 0) {
        prevElem = jQuery(scrollParentRef).find("li.o:last-child");
      }
      prevElem.addClass("selected");
    }
    scrollToSelected();
  }

  export function moveDown() {
    let elem = getHovered();
    if(elem) {
      let nextElem;

      if(elem.classList.contains("selected")) {
        elem.classList.remove("selected");
        nextElem = jQuery(elem).next();
      }
      else {
        nextElem = jQuery(elem);
      }

      if(nextElem.length === 0) {
        nextElem = jQuery(scrollParentRef).find("li.o:first-child");
      }
      nextElem.addClass("selected");
    }
    scrollToSelected();
  }

  export function selectFocused() {
    let elem = scrollParentRef.querySelector(".selected");
    if(elem) {
      elem.click();
      return true;
    }
    return false;
  }

  export function clearSelected() {
    let elem = getHovered();
    if(elem && elem.classList.contains("selected")) {
      elem.classList.remove("selected");
    }
  }

  function onOptionsChange() {
    tick().then(function() {
        scrollToSelected();
    });
  }

  function getHovered() {
    let hoveredElem = scrollParentRef.querySelector(".selected");
    if(!hoveredElem) {
      hoveredElem = scrollParentRef.querySelector(".o");
    }
    return hoveredElem;
  }

  function scrollToSelected() {
    let elem = scrollParentRef.querySelector(".selected");
    if(elem) {
      if(elem.offsetTop + elem.clientHeight > (scrollParentRef.scrollTop + scrollParentRef.clientHeight)) {
        scrollParentRef.scrollTop = elem.offsetTop;
      }
      else if(elem.offsetTop < scrollParentRef.scrollTop) {
        scrollParentRef.scrollTop = elem.offsetTop;
      }
    }
    return elem;
  }
</script>

<div class="list-search-options">
  <div bind:this={scrollParentRef} class="opt-container">
    <Options options={options} textKey={textKey} childKey={childKey}
             getFormatted={getFormatted}
             on:selection isSelected={isSelected} optionComponent={optionComponent}/>
  </div>
  
  {#if totalCount === 0}
    <div class="sub-text">
      No results found
    </div>
  
  {:else if (typeof totalCount !== "undefined") && (totalCount !== options.length)}
    <div class="sub-text">
      showing {options.length} of {totalCount}
    </div>
  {/if}
</div>