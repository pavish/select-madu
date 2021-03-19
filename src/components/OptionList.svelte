<svelte:options immutable={true}/>

<script lang="typescript">
  import type { SvelteComponent } from 'svelte';
  import OptionElement from './OptionElement.svelte';
  import type {
    Option,
    Keys,
    Selected,
  } from '../types';

  export let options: Option[];
  export let optionComponent: SvelteComponent;
  export let keys: Keys;
  export let selected: Selected;
  export const innerTree = false;
</script>

{#each options as option}
  <OptionElement option={option} keys={keys} optionComponent={optionComponent}
                 selected={selected} on:selection>
    <svelte:self options={option[keys.child]} optionComponent={optionComponent}
                  keys={keys} selected={selected} innerTree={true} on:selection/>
  </OptionElement>
{/each}
