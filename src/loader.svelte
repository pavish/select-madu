<svelte:options immutable={true}/>

<script>
  export let type = "cubes";
  export let size = 40;
  export let classes = "";
</script>

<div class="abs-overlay loader-bg {classes}" style="width:{size}px;height:{size}px">
  {#if type === "circle"}
    <div class="la-ball-spin-clockwise">
      {#each { length: 8 } as _}
        <div></div>
      {/each}
    </div>

  {:else if type === "cline"}
    <div class="spinner-border"></div>

  {:else}
    <div class="sk-wandering-cubes">
      <div class="sk-cube sk-cube1"></div>
      <div class="sk-cube sk-cube2"></div>
    </div>
  {/if}
</div>