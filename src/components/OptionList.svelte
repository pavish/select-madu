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

  export let level = 1;

  $: nextLevel = level + 1;
</script>

{#each options as option}
  <OptionElement option={option} keys={keys} optionComponent={optionComponent}
                 selected={selected} level={level} on:selection>
    <svelte:self options={option[keys.child]} optionComponent={optionComponent}
                  keys={keys} selected={selected} level={nextLevel} on:selection/>
  </OptionElement>
{/each}
