<svelte:options immutable={true}/>

<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let options = [];
  export let optionComponent;
  export let textKey;
  export let childKey;
  export let getFormatted;
  export let isSelected;

  function selectOption(opt) {
    dispatch("selection", opt);
  }
</script>

<ul>
  {#each options as opt}
    {#if opt[childKey]}
      <li class="o-h">
        {getFormatted("optionParent", opt)}
      </li>
      
      <svelte:self options={opt[childKey]} textKey={textKey} childKey={childKey} 
                   getFormatted={getFormatted} 
                   on:selection isSelected={isSelected} optionComponent={optionComponent}/>

    {:else}
      <li class="o {opt.classes ? opt.classes : ''}"
          class:disabled={opt.disabled} 
          class:selected="{isSelected(opt)}"
          on:click="{e => selectOption(opt)}">

          {#if optionComponent}
            <svelte:component this={optionComponent} {...opt}/>

          {:else}
            {getFormatted("option", opt)}

          {/if}
      </li>
    {/if}
  {/each}
</ul>