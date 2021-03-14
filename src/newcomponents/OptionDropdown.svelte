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
  } from '../interfaces';
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

  let instance: SvelteComponent;

  function setOnChange(
    name: string,
    value: Option[] | Keys | Selected| boolean | States | Animation,
  ) {
    if (instance) {
      instance.$$set({
        [name]: value,
      });
    }
  }

  onMount(() => {
    instance = new OptionHolder({
      target: document.querySelector('body'),
      props: {
        optionComponent,
        options,
        keys,
        selected,
        parent,
        state,
        animate,
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
      setTimeout(() => {
        instance.$destroy();
      }, 200);
    } else {
      instance.$destroy();
    }
  });

  $: setOnChange('options', options);
  $: setOnChange('keys', keys);
  $: setOnChange('selected', selected);
  $: setOnChange('state', state);
  $: setOnChange('animate', animate);
</script>
