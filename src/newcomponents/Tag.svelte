<svelte:options immutable={true}/>

<script lang="typescript">
  import { createEventDispatcher } from 'svelte';
  import type {
    Option,
    Keys,
  } from '../interfaces';

  const dispatch: <EventKey extends string>
    (type: EventKey, detail: { option: Option, index: number }) => void = createEventDispatcher();

  export let index: number;
  export let option: Option;
  export let keys: Keys;
  export let componentId: number;

  $: title = option[keys.text]?.toString();

  function removeSelection() {
    dispatch('removeElement', {
      option,
      index,
    });
  }
</script>

<li class="tag" style="position:relative;" title={title}>
  <span id="select-madu-{componentId}-tag-{index}">{title}</span>

  <button tabindex="-1" title="Remove item" class="it-icon-holder cl-i"
          on:click|preventDefault={removeSelection}
          style="postition:relative;margin:0px;"
          id="select-madu-{componentId}-remove-tag-{index}"
          aria-label="Remove item" aria-describedby="select-madu-{componentId}-tag-{index}">
    <svg xmlns="http://www.w3.org/2000/svg"
      width="14" height="14" viewBox="0 0 24 24"
      class="it-icon" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
</li>
