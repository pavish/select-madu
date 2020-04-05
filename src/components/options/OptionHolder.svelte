<svelte:options immutable={true}/>

<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import Options from './OptionList.svelte';
  import FormatterUtil from './../../utils/FormatterUtil.js';

  const dispatch = createEventDispatcher();

  export let options = [];
  export let optionComponent;

  export let textKey = "name";
  export let childKey = "id";
  export let totalCount;

  export let getFormatted = function(type, opt) {
    return FormatterUtil.formatByType(undefined, type, opt, textKey);
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
        prevElem = elem.previousElementSibling;
      }
      else {
        prevElem = elem;
      }

      if(!prevElem) {
        prevElem = scrollParentRef.querySelector("li.o:last-child");
      }

      if(prevElem) {
        prevElem.classList.add("selected");
      }
    }
    scrollToSelected();
  }

  export function moveDown() {
    let elem = getHovered();
    if(elem) {
      let nextElem;

      if(elem.classList.contains("selected")) {
        elem.classList.remove("selected");
        nextElem = elem.nextElementSibling;
      }
      else {
        nextElem = elem;
      }

      if(!nextElem) {
        nextElem = scrollParentRef.querySelector("li.o:first-child");
      }

      if(nextElem) {
        nextElem.classList.add("selected");
      }
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

<div class="slmd-dropdown">
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