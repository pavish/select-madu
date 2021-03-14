<svelte:options immutable={true}/>

<script lang="typescript">
  import { createEventDispatcher, tick } from 'svelte';
  import OptionHolder from './options/OptionHolder.svelte';
  import FormatterUtil from '../utils/FormatterUtil';
  import DataFetcher from '../utils/DataFetcher';
  import GeneralUtils from '../utils/GeneralUtils';
  
  const dispatch = createEventDispatcher();

  export let classes = '';
  export let placeholder = 'Select option';

  export let selected;
  export let datasource = []; // [] | Function returning promise

  export let disabled = false;
  export let multiple = false;
  export let search = true;
  
  export let textKey = 'text';
  export let valueKey = 'text';
  export let childKey = 'children';
  export let formatters = null;

  export function getSelected() {
    return selected;
  }

  let baseRef;
  let searchInputRef;
  let listOptsRef;
  let searchVal = '';
  let isOpen = false;
  let optionsToShow = [];
  let state = 'loading'; // loading, ready
  let isInternalOp = false;
  let totalCount = 0;
  let selOptRef;
  let fetchPromise;

  $: fetchData(datasource, searchVal, multiple);
  $: noSearchView = !isOpen || !search;

  const isSelected = function (_opt) {
    if (!multiple) {
      return (!_opt.disabled && selected && (selected[valueKey] === _opt[valueKey]));
    }
    return (selected && selected.map((elem) => elem[valueKey]).indexOf(_opt[valueKey]) !== -1);
  };

  const getFormatted = function (_multiple, _obj) {
    return FormatterUtil.formatByType(_multiple, _obj, textKey, formatters);
  };

  function fetchData(_datasource, _searchVal, _multiple) {
    state = 'loading';
  
    if (fetchPromise) {
      fetchPromise.cancel();
    }
    fetchPromise = DataFetcher(_datasource, _searchVal, textKey, childKey);

    fetchPromise.then(
      (res) => {
        setData(_multiple, res.content, res.count);
        state = 'ready';
      },
      () => {
        state = 'error';
      },
    );
  }
  

  function setData(_multiple, data, count) {
    optionsToShow = data;
    totalCount = count;
    if (!_multiple && !selected && optionsToShow.length > 0) {
      let sel = optionsToShow[0];
      while (sel[childKey]) {
        sel = sel[childKey][0];
      }
      setSelected(sel);
    }
  }

  function open() {
    isOpen = true;
    tick().then(() => {
      if (searchInputRef) {
        searchInputRef.focus();
      }
    });
  }

  function toggle() {
    isInternalOp = true;
    if (isOpen) {
      hide();
    } else {
      open();
    }
  }

  function hide() {
    isOpen = false;
    searchVal = '';
  }

  function selectOption(event) {
    const opt = event.detail;
    if (!multiple) {
      if (selected !== opt) {
        setSelected(opt);
      }
      hide();
    } else {
      if (selected) {
        if (!selected.find((el) => el[valueKey] === opt[valueKey])) {
          setSelected([...selected, opt]);
        }
      } else {
        setSelected([opt]);
      }
      searchVal = '';
      open();
    }
  }

  function removeSelection(index) {
    isInternalOp = true;
    selected.splice(index, 1);
    setSelected([].concat(selected));
  }

  function setSelected(_selected) {
    selected = _selected;
    tick().then(() => {
      dispatch('selection', selected);
    });
  }

  function checkAndOpen() {
    tick().then(() => {
      if (!isInternalOp) {
        open();
      }
      isInternalOp = false;
    });
  }

  function checkAndClose() {
    if (isOpen) {
      tick().then(() => {
        if (!isInternalOp && !GeneralUtils.closest(event.target, baseRef)) {
          hide();
        }
        isInternalOp = false;
      });
    }
  }

  function keyDown(e) {
    if (e.keyCode === 13) {
      if (!isOpen) {
        open();
      } else if (listOptsRef && listOptsRef.selectFocused()) {
        hide();
      }
    } else if (e.keyCode === 27 || e.keyCode === 9) { // esc or tab
      if (isOpen) {
        hide();
      }
    } else if (e.keyCode === 40) { // down arrow
      if (!isOpen) {
        open();
      } else if (listOptsRef) {
        listOptsRef.moveDown();
      }
    } else if (e.keyCode === 38 && listOptsRef) { // up arrow
      listOptsRef.moveUp();
    }
  }

  function onFocusIn() {
    baseRef.classList.add('focus');
  }

  function onFocusOut() {
    baseRef.classList.remove('focus');
  }
</script>

<svelte:window on:click={checkAndClose}/>

<div bind:this={baseRef} class="select-madu {classes}" class:multiple class:open={isOpen} class:disabled tabindex="0" on:keydown={keyDown}>

  <div bind:this={selOptRef} class="selected-option" class:placeholder={!selected || (multiple && selected.length === 0)}>
    <div class="slmd-inner" on:click={checkAndOpen}>
      {#if !multiple}
        {#if noSearchView}
          { selected ? getFormatted('selected', selected) : placeholder }
        {/if}
      
      {:else if selected && selected.length > 0}
        {#each selected as elem, index (elem[valueKey])}
          <span class="tag">
            {getFormatted('selected', elem)}
            <div class="it-icon-holder cl-i" on:click={(e) => removeSelection(index)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </span>
        {/each}

      {:else if noSearchView}
        {placeholder}
      {/if}
    
      <input bind:this={searchInputRef} type="text" bind:value={searchVal}
             class="search-input" placeholder="search" 
             style="width:{(searchVal.length + 1) * 0.6}em"
             class:hidden={noSearchView} on:focus={onFocusIn} on:blur={onFocusOut}/>
    </div>

    <div class="status-ind" on:click={toggle}>
      {#if state === 'loading' && isOpen}
        <div class="loader">
          <div class="spinner-border"></div>    
        </div>
    
      {:else}
        <!-- <span>{isOpen ? 'chevron-up' : 'chevron-down'}</span> -->
        <div class="it-icon-holder">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="it-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      {/if}
    </div>
  </div>

  {#if isOpen}
    <OptionHolder bind:this={listOptsRef} options={optionsToShow} childKey={childKey}
                  getFormatted={getFormatted}
                  on:selection={selectOption} isSelected={isSelected} totalCount={totalCount}/>
  {/if}

</div>
