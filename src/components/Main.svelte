<svelte:options immutable={true}/>

<script lang="typescript" context="module">
  let id = 0;

  export function getId(): number {
    id += 1;
    return id;
  }
</script>

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
  } from '../types';
  import { States } from '../types';
  import { isOutOfBounds, fetchOptions, setAttribute } from '../utilities';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const componentId: number = getId() as number;

  // Display and behaviour props
  export let classes: string | string[];
  export let placeholder = 'Select option';
  export let disabled = false;
  export let multiple = false;
  export let search = true;
  export let optionComponent: SvelteComponent;
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
  export let paddingPerLevel = 12;

  export let keys: Keys;
  $: keys = {
    text: textKey,
    value: valueKey,
    child: childKey,
  };

  // Selection and datasource
  export let selected: Selected;
  export let datasource: DataSource = [];
  export let selectFirstOption = true;

  export { selected as value };

  let searchValue = '';
  let options: Option[] = [];
  let state = States.Loading;
  let fetchPromise: CancellablePromiseLike<Option[]>;

  const setOptions = (
    _datasource: DataSource,
    _searchVal: string,
    _multiple: boolean,
    _selectFirstOption: boolean,
    _keys: Keys,
  ) => {
    state = States.Loading;
  
    if (typeof fetchPromise !== 'undefined') {
      fetchPromise.cancel();
    }
    fetchPromise = fetchOptions(_datasource, _searchVal, _keys);

    fetchPromise.then(
      (res) => {
        options = res;
        state = States.Ready;
        if (!_multiple && _selectFirstOption && options.length > 0 && !selected) {
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
  $: setOptions(datasource, searchValue, multiple, selectFirstOption, keys);

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

  // Aria properties
  const getAriaValue = (
    key: string,
    value: string,
    condition: boolean,
  ): { key: string, value: string } => ({
    key,
    value: condition ? value : '',
  });

  $: ariaDescribedBy = getAriaValue(
    'aria-describedby',
    `select-madu-${componentId}-value`,
    multiple,
  );

  $: ariaOwns = getAriaValue(
    'aria-owns',
    `select-madu-${componentId}-options`,
    isOpen,
  );

  $: ariaLabelledBy = getAriaValue(
    'aria-labelledby',
    `select-madu-${componentId}-value`,
    !multiple,
  );

  $: ariaControls = getAriaValue(
    'aria-controls',
    `select-madu-${componentId}-value`,
    !multiple,
  );

  function focusBase() {
    baseRef.focus();
  }

  function focusSearch(): void {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  }

  function open() {
    if (!disabled) {
      isOpen = true;
      const promise: Promise<void> = tick();
      promise.then(() => focusSearch()).catch(() => null);
    }
  }

  function close() {
    isOpen = false;
    searchValue = '';
  }

  function checkAndClose(event: Event) {
    if (isOpen) {
      const element: HTMLElement = event.target as HTMLElement;
      if (isOutOfBounds(element, baseRef, componentId)) {
        close();
      }
    }
  }

  function checkAndOpen(): void {
    if (!isOpen) {
      open();
    } else {
      focusSearch();
    }
  }

  function toggle(): void {
    if (!isOpen) {
      open();
    } else {
      close();
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
    focusSearch();
  }

  function onSelection(event: { detail: Option }) {
    const option = event.detail;
    if (multiple) {
      if (!option.disabled) {
        if (Array.isArray(selected)) {
          let index = -1;
          for (let i = 0; i < selected.length; i += 1) {
            if (selected[i][keys.value] === option[keys.value]) {
              index = i;
              break;
            }
          }
          if (index > -1) {
            removeElement(index);
          } else {
            selected = [...selected, option];
          }
        } else {
          selected = [option];
        }
      }
      focusSearch();
    } else {
      if (!option.disabled) {
        selected = option;
      }
      close();
      focusBase();
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (disabled) {
      return;
    }

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
     class:disabled class:placeholder={isPlaceHolder} class:animate
     tabindex={0} on:keydown={onKeyDown}
     on:focus={onFocusIn} on:blur={onFocusOut}
     style="position: relative;border-width:1px;border-style:solid;"
     aria-disabled="{disabled}" role="combobox" aria-haspopup="listbox"
     aria-expanded="{isOpen}" dir="ltr"
     use:setAttribute={ariaOwns} use:setAttribute={ariaLabelledBy}
     use:setAttribute={ariaControls}>

  <div class="select-madu-inner" on:click={checkAndOpen}>
    {#if multiple && Array.isArray(selected) && selected.length > 0}
      <ul style="margin:0;list-style:none;padding:0;position:relative;display:inline-block;"
          id="select-madu-{componentId}-value">
        {#each selected as elem, index (elem[keys.value])}
          <Tag componentId={componentId} option={elem}
               index={index} keys={keys} on:removeElement={onRemoveElement}/>
        {/each}
      </ul>
    {/if}

    {#if search && isOpen}
      <input bind:this={searchInputRef} type="search" bind:value={searchValue}
             class="select-madu-input" placeholder="Search" tabindex={0}
             style="width:{inputWidth}em;min-width: 50px;max-width: 100%;
                    border:none;outline:0;padding:0;margin:0;box-sizing:border-box;
                    font-family:inherit;font-size:inherit;"
             aria-autocomplete="list" autocorrect="off" autocapitalize="none" spellcheck="false"
             autocomplete="off" role="searchbox" aria-label="Search"
             aria-controls="select-madu-{componentId}-options"
             use:setAttribute={ariaDescribedBy}/>

    {:else if isPlaceHolder}
      {placeholder}
    
    {:else if !multiple}
      <span id="select-madu-{componentId}-value" role="textbox"
            aria-readonly="true" title={selected[keys.text]}>
        {selected[keys.text]}
      </span>

    {/if}
  </div>

  <div class="select-madu-arrow" class:loading={state === States.Loading}
       role="presentation" on:click={toggle}>
    {#if state === States.Loading}
      <div class="select-madu-spinner" aria-hidden="true">
        <div class="spinner-border"></div>
      </div>
  
    {:else}
      <div class="select-madu-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    {/if}
  </div>
</div>

{#if isOpen}
  <OptionDropdown bind:this={optionDropdownRef} componentId={componentId}
                  parent={baseRef} classes={classes}
                  optionComponent={optionComponent} options={options} keys={keys}
                  selected={selected} multiple={multiple}
                  state={state} animate={animate} paddingPerLevel={paddingPerLevel}
                  on:selection={onSelection}/>
{/if}
