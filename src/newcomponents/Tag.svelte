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

  function removeSelection() {
    dispatch('removeElement', {
      option,
      index,
    });
  }
</script>

<span class="tag">
  {option[keys.text]}

  <div class="it-icon-holder cl-i" on:click|preventDefault={removeSelection}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon">
      <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
  </div>
</span>
