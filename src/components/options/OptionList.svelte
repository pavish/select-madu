<svelte:options immutable={true}/>

<script lang="typescript">
  import { createEventDispatcher, SvelteComponent } from 'svelte';

  import type { Option } from '../../interfaces';

  const dispatch = createEventDispatcher();

  export let options: Option[];
  export let optionComponent: SvelteComponent;
  export let childKey: string;
  export let getFormatted: (type: string, opt: Option) => string;
  export let isSelected: (arg: Option) => boolean;

  const selectOption = (option: Option): void => {
    dispatch('selection', option);
  };
</script>

<ul>
  {#each options as opt}
    {#if opt[childKey]}
      <li class="o-h">
        {getFormatted('optionParent', opt)}
      </li>
      
      <svelte:self options={opt[childKey]} childKey={childKey} 
                   getFormatted={getFormatted} 
                   on:selection isSelected={isSelected} optionComponent={optionComponent}/>

    {:else}
      <li class="o {opt.classes ? opt.classes : ''}"
          class:disabled={opt.disabled} 
          class:selected="{isSelected(opt)}"
          on:click="{() => selectOption(opt)}">

          {#if optionComponent}
            <svelte:component this={optionComponent} {...opt}/>

          {:else}
            {getFormatted('option', opt)}

          {/if}
      </li>
    {/if}
  {/each}
</ul>
