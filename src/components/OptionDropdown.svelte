<svelte:options immutable={true}/>

<script type="typescript">
  import {
    onDestroy,
    onMount,
    SvelteComponent,
    createEventDispatcher,
  } from 'svelte';
  import type {
    Option,
    Keys,
    Selected,
    States,
    Animation,
    DropdownKeyboardInteractions,
  } from '../types';
  import OptionHolder from './OptionHolder.svelte';

  const dispatch: <EventKey extends string>
    (type: EventKey, detail: { option: Option, index: number }) => void = createEventDispatcher();

  export let optionComponent: SvelteComponent;
  export let options: Option[];
  export let keys: Keys;
  export let selected: Selected;
  export let parent: Element;
  export let state: States;
  export let animate: Animation;
  export let multiple: boolean;
  export let classes: string | string[];
  export let componentId: number;
  export let paddingPerLevel: number;

  let instance: OptionHolder & DropdownKeyboardInteractions;

  function setOnChange(
    name: string,
    value: Option[] | Keys | Selected | boolean | number
          | States | Animation | string | string[],
  ) {
    if (instance) {
      instance.$set({
        [name]: value,
      });
    }
  }

  onMount(() => {
    instance = new OptionHolder({
      target: document.querySelector('body'),
      props: {
        componentId,
        optionComponent,
        options,
        keys,
        selected,
        parent,
        state,
        animate,
        multiple,
        classes,
        paddingPerLevel,
      },
    });

    const off = instance.$on('selection', (event) => {
      dispatch('selection', event.detail);
    });

    return () => off();
  });

  onDestroy(() => {
    setOnChange('isOpen', false);
    if (animate) {
      let duration = 100;
      if (typeof animate === 'object') {
        duration = Number.isNaN(animate.duration) ? duration : animate.duration;
      }

      setTimeout(() => {
        instance.$destroy();
      }, duration + 100);
    } else {
      instance.$destroy();
    }
  });

  export function moveUp(): void {
    if (instance) {
      instance.moveUp();
    }
  }

  export function moveDown(): void {
    if (instance) {
      instance.moveDown();
    }
  }
  
  export function selectHovered(): void {
    if (instance) {
      instance.selectHovered();
    }
  }

  $: setOnChange('options', options);
  $: setOnChange('keys', keys);
  $: setOnChange('selected', selected);
  $: setOnChange('state', state);
  $: setOnChange('animate', animate);
  $: setOnChange('multiple', multiple);
  $: setOnChange('classes', classes);
  $: setOnChange('paddingPerLevel', paddingPerLevel);
</script>
