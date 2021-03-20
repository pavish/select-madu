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
  export let paddingPerLevel: number;

  $: nextLevel = level + 1;
</script>

{#each options as option}
  <OptionElement option={option} keys={keys} optionComponent={optionComponent}
                 selected={selected} level={level} paddingPerLevel={paddingPerLevel}
                 on:selection>
    <svelte:self options={option[keys.child]} optionComponent={optionComponent}
                 keys={keys} selected={selected} level={nextLevel}
                 paddingPerLevel={paddingPerLevel} on:selection/>
  </OptionElement>
{/each}
