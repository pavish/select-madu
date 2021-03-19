<svelte:options immutable={true}/>

<script lang="typescript">
  import { tick } from 'svelte';
  import type { SvelteComponent } from 'svelte';
  import OptionDropdown from './OptionDropdown.svelte';
  import Tag from './Tag.svelte';
  import type {
    Selected,
    DataSource,
    Keys,
    Option,
    CancellablePromiseLike,
    Animation,
    DropdownKeyboardInteractions,
  } from '../interfaces';
  import { States } from '../interfaces';
  import { closest, fetchOptions } from '../utils/utilities';

  // Display and behaviour props
  export let classes: string | string[];
  export let placeholder = 'Select option';
  export let disabled = false;
  export let multiple = false;
  export let search = true;
  export let optionComponent: SvelteComponent;
  export let name = '';
  export let animate: Animation = false;

  export { classes as class };

  $: parentClass = [
    'select-madu',
    (Array.isArray(classes) ? classes.join(' ') : classes),
  ].join(' ').trim();

  // Keys and Formatters
  export let textKey = 'text';
  export let valueKey = textKey;
  export let childKey = 'children';

  export let keys: Keys;
  $: keys = {
    text: textKey,
    value: valueKey,
    child: childKey,
  };

  // Selection and datasource
  export let selected: Selected;
  export let datasource: DataSource = [];

  export { selected as value };

  let searchValue = '';
  let options: Option[] = [];
  let state = States.Loading;
  let fetchPromise: CancellablePromiseLike<Option[]>;

  const setOptions = (
    _datasource: DataSource,
    _searchVal: string,
    _multiple: boolean,
    _keys: Keys,
  ) => {
    state = States.Loading;
  
    if (typeof fetchPromise !== 'undefined') {
      // eslint-disable-next-line no-void
      void fetchPromise.cancel();
    }
    fetchPromise = fetchOptions(_datasource, _searchVal, _keys);

    fetchPromise.then(
      (res) => {
        options = res;
        state = States.Ready;
        if (!_multiple && options.length > 0 && !selected) {
          let [_selected] = options;
          while (_selected[_keys.child]) {
            [_selected] = _selected[_keys.child] as Option[];
          }
          selected = _selected;
        }
        return options;
      },
      () => {
        state = States.Error;
      },
    ).catch(
      () => {
        state = States.Error;
      },
    );
  };

  // Option setter
  $: setOptions(datasource, searchValue, multiple, keys);

  // Internal
  let isOpen = false;
  let focus = false;
  let baseRef: HTMLDivElement;

  let isPlaceHolder: boolean;
  $: isPlaceHolder = !selected
                      || (multiple && Array.isArray(selected) && selected.length === 0);

  let inputWidth: number;
  $: inputWidth = (searchValue.length + 1) * 0.6;

  // Refs
  let searchInputRef: HTMLInputElement;
  let optionDropdownRef: OptionDropdown & DropdownKeyboardInteractions;

  function open() {
    isOpen = true;
    const promise: Promise<void> = tick();
    promise.then(() => {
      if (searchInputRef) {
        return searchInputRef.focus();
      }
      return null;
    }).catch(() => null);
  }

  function close() {
    isOpen = false;
    searchValue = '';
  }

  function focusBase() {
    baseRef.focus();
  }

  function checkAndClose(event: Event) {
    if (isOpen) {
      const promise: Promise<void> = tick();

      promise.then(() => {
        const closestParent: HTMLElement = closest(event.target, baseRef);
        if (!closestParent) {
          close();
        }
        return null;
      }).catch(() => null);
    }
  }

  function checkAndOpen(): void {
    if (!isOpen) {
      open();
    } else if (searchInputRef) {
      searchInputRef.focus();
    }
  }

  function removeElement(index: number): void {
    if (Array.isArray(selected)) {
      selected.splice(index, 1);
      selected = [...selected];
    }
  }

  function onRemoveElement(event: { detail: { index: number } }): void {
    removeElement(event.detail.index);
  }

  function selectOption(event: { detail: Option }) {
    if (multiple) {
      if (Array.isArray(selected)) {
        selected = [...selected, event.detail];
      } else {
        selected = [event.detail];
      }
    } else {
      selected = event.detail;
      close();
    }
    focusBase();
  }

  function onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        if (isOpen) {
          if (optionDropdownRef) {
            optionDropdownRef.selectHovered();
          }
        } else {
          open();
        }
        break;
      case 'Escape':
        if (isOpen) {
          close();
          focusBase();
        }
        break;
      case 'ArrowDown':
        if (isOpen && optionDropdownRef) {
          optionDropdownRef.moveDown();
        } else {
          open();
        }
        break;
      case 'ArrowUp':
        if (isOpen && optionDropdownRef) {
          optionDropdownRef.moveUp();
        } else {
          open();
        }
        break;
      case 'Tab':
        if (isOpen) {
          close();
        }
        break;
      case 'Backspace':
        if (
          isOpen && search
          && multiple && !searchValue.trim()
          && Array.isArray(selected) && selected.length > 0
        ) {
          const lastElement = selected[selected.length - 1];
          removeElement(selected.length - 1);
          searchValue = `${lastElement[keys.text]?.toString() || ''} `;
        }
        break;
      default:
        break;
    }
  }

  function onFocusIn() {
    focus = true;
  }

  function onFocusOut() {
    focus = false;
  }
</script>

<svelte:window on:click={checkAndClose}/>

<div bind:this={baseRef} class={parentClass} class:multiple
     class:open={isOpen} class:focus={focus || isOpen} class:search
     class:disabled class:placeholder={isPlaceHolder}
     tabindex={0} on:click={checkAndOpen} on:keydown={onKeyDown}
     on:focus={onFocusIn} on:blur={onFocusOut}
     style="position: relative;border-width:1px;border-style:solid;"
     aria-disabled="{disabled}" role="combobox" aria-haspopup="listbox"
     aria-expanded="{isOpen}" aria-label={name}>

  <div class="slmd-inner">
    {#if multiple && Array.isArray(selected) && selected.length > 0}
      <ul style="margin:0;list-style:none;padding:0;position:relative;display:inline-block;">
        {#each selected as elem, index (elem[keys.value])}
          <Tag option={elem} index={index} keys={keys} on:removeElement={onRemoveElement}/>
        {/each}
      </ul>
    {/if}

    {#if search && isOpen}
      <input bind:this={searchInputRef} type="text" bind:value={searchValue}
            class="search-input" placeholder="Search" 
            style="width:{inputWidth}em;min-width: 50px;max-width: 100%;border:none;outline:0;"
            aria-autocomplete="both"/>

    {:else if isPlaceHolder}
      {placeholder}
    
    {:else if !multiple}
      <span role="textbox" aria-readonly="true" title={selected[keys.text]}>
        {selected[keys.text]}
      </span>

    {/if}
  </div>

  <div class="status-ind">
    {#if state === States.Loading}
      <div class="loader">
        <div class="spinner-border"></div>
      </div>
  
    {:else}
      <div class="it-icon-holder">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    {/if}
  </div>
</div>

{#if isOpen}
  <OptionDropdown bind:this={optionDropdownRef} parent={baseRef} classes={classes}
                  optionComponent={optionComponent} options={options} keys={keys}
                  selected={selected} multiple={multiple}
                  state={state} animate={animate}
                  on:selection={selectOption}/>
{/if}
