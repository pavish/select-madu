<svelte:options immutable={true}/>

<script lang="typescript">
  import { createEventDispatcher, SvelteComponent } from 'svelte';
  import type { Option, Selected, Keys } from '../types';

  const dispatch: <EventKey extends string>
    (type: EventKey, detail: Selected) => void = createEventDispatcher();

  export let option: Option;
  export let optionComponent: SvelteComponent;
  export let keys: Keys;
  export let selected: Selected;
  export let level: number;

  function getOptionClasses(opt: Option) : string {
    let classList = opt[keys.child] ? 'o-h' : 'o';
    if (opt.classes) {
      if (Array.isArray(opt.classes)) {
        classList = `${classList} ${opt.classes.join(' ')}`;
      } else {
        classList = `${classList} ${opt.classes}`;
      }
    }
    return classList;
  }

  function isSelected(_option: Option, _selected: Selected): boolean {
    let isOptionSelected = false;
    if (Array.isArray(_selected)) {
      for (let i = 0; i < _selected.length; i += 1) {
        isOptionSelected = (_selected[i][keys.value] === _option[keys.value]);
        if (isOptionSelected) {
          break;
        }
      }
    } else if (_selected) {
      isOptionSelected = _selected[keys.value] === _option[keys.value];
    }
    return isOptionSelected;
  }

  $: isSelectedOption = isSelected(option, selected);
  $: classes = getOptionClasses(option);

  function selectOption(): void {
    dispatch('selection', option);
  }
</script>

{#if option[keys.child]}
  <li class={classes} role="group" style="position:relative;"
      aria-label={option[keys.text]}>
    <strong style="display:block;padding-left:{level * 10}px;">{option[keys.text]}</strong>

    <ul role="none" style="margin:0;list-style:none;padding:0;position:relative;">
      <slot></slot>
    </ul>
  </li>

{:else}
  <li class={classes}
      class:disabled={option.disabled} 
      class:selected={isSelectedOption}
      class:hovered={isSelectedOption}
      style="position:relative;padding-left:{level * 10}px"
      on:click={selectOption}
      role="option"
      aria-selected="{isSelectedOption}">

    {#if optionComponent}
      <svelte:component this={optionComponent} {...option}/>

    {:else}
      {option[keys.text]}

    {/if}
  </li>
{/if}
