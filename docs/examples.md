---
layout: page
title: SelectMadu - Examples
permalink: /examples
---

<script type="text/javascript" src="https://unpkg.com/select-madu@2.1.1/dist/selectmadu.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/select-madu@2.1.1/dist/selectmadu.css">
<style>
  .select-madu-arrow .select-madu-spinner .spinner-border {
    top: -41%;
  }
</style>

# Examples

### Simple selection

<div id="example1"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example1"),
    props: {
      search: false,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu search={false} datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example1"),
    props: {
      search: false,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
</script>

---

### Search, Custom keys

<div id="example2"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example2"),
    props: {
      search: true, //Optional, true is the default value for search
      textKey: "pokemon",
      valueKey: "id",
      datasource: [
        { pokemon: "Pikachu", id: 1 },
        { pokemon: "Bulbasaur", id: 2 },
        { pokemon: "Charmander", id: 3 },
        { pokemon: "Squirtle", id: 4 },
        { pokemon: "Chikorita", id: 5 },
        { pokemon: "Treecko", id: 6 }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu textKey="pokemon" valueKey="id" datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example2"),
    props: {
      search: true, //Optional, true is the default value for search
      textKey: "pokemon",
      valueKey: "id",
      datasource: [
        { pokemon: "Pikachu", id: 1 },
        { pokemon: "Bulbasaur", id: 2 },
        { pokemon: "Charmander", id: 3 },
        { pokemon: "Squirtle", id: 4 },
        { pokemon: "Chikorita", id: 5 },
        { pokemon: "Treecko", id: 6 }
      ]
    }
  });
</script>

---

### Multiple selection

<div id="example3"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example3"),
    props: {
      multiple: true,
      datasource: [
        { text: "Attack On Titan" },
        { text: "Black Clover" },
        { text: "My Hero Academia" },
        { text: "Naruto" },
        { text: "One Piece" },
        { text: "Dragon Ball Z" },
        { text: "Bleach" },
        { text: "Fairy Tail" },
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu multiple={true} datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example3"),
    props: {
      multiple: true,
      datasource: [
        { text: "Attack On Titan" },
        { text: "Black Clover" },
        { text: "My Hero Academia" },
        { text: "Naruto" },
        { text: "One Piece" },
        { text: "Dragon Ball Z" },
        { text: "Bleach" },
        { text: "Fairy Tail" },
      ]
    }
  });
</script>

---

### Nested options

<div id="example4"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example4"),
    props: {
      datasource: [
        { text: "1 Leaf" }, 
        {
          text: "2 Parent",
          children: [
            { text: "2.1 Leaf" },
            {
              text: "2.2 Child",
              children: [
                { text: "2.1.1 Leaf" },
                { text: "2.1.2 Leaf" },
                { text: "2.1.3 Leaf" }
              ]
            },
            { text: "2.3 Leaf" } 
          ]
        },
        {
          text: "3 Parent",
          children: [
            { text: "3.1 Leaf" }
          ]
        }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example4"),
    props: {
      datasource: [
        { text: "1 Leaf" }, 
        {
          text: "2 Parent",
          children: [
            { text: "2.1 Leaf" },
            {
              text: "2.2 Child",
              children: [
                { text: "2.1.1 Leaf" },
                { text: "2.1.2 Leaf" },
                { text: "2.1.3 Leaf" }
              ]
            },
            { text: "2.3 Leaf" } 
          ]
        },
        {
          text: "3 Parent",
          children: [
            { text: "3.1 Leaf" }
          ]
        }
      ]
    }
  });
</script>

---

### Remote: async data

<div id="example5"></div>

```javascript
  // Returns a promise, ideal for fetch calls to load data from server
  // Gets called on component initialization and on each keydown during search
  const asyncFn = (searchValue) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let result = [
          "Ooty, India",
          "Santiago, Chile",
          "Christchurch, New Zealand",
          "New York, USA"
        ];

        if (searchValue && searchValue.trim()) {
          result = result.filter(elem =>
            elem.toLowerCase().indexOf(searchValue.trim().toLowerCase()) > -1
          );
        }

        resolve(result.map(entry => ({ text: entry })));
      }, 2000);
    });
  };

  new SelectMadu({
    target: document.querySelector("#example5"),
    props: {
      datasource: asyncFn
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu datasource={asyncFn} />
```

<script>
  const asyncFn = (searchValue) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let result = [
          "Ooty, India",
          "Santiago, Chile",
          "Christchurch, New Zealand",
          "New York, USA"
        ];

        if (searchValue && searchValue.trim()) {
          result = result.filter(elem =>
            elem.toLowerCase().indexOf(searchValue.trim().toLowerCase()) > -1
          );
        }

        resolve(result.map(entry => ({ text: entry })));
      }, 2000);
    });
  };

  new SelectMadu({
    target: document.querySelector("#example5"),
    props: {
      datasource: asyncFn
    }
  });
</script>

---

### Disabling component

<div id="example6"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example6"),
    props: {
      disabled: true,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu disabled={true} datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example6"),
    props: {
      disabled: true,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
</script>

---

### Disabling individual options

<div id="example7"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example7"),
    props: {
      datasource: [
        { text: "Option 1" },
        { text: "Option 2", disabled: true },
        { text: "Option 3" }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example7"),
    props: {
      datasource: [
        { text: "Option 1" },
        { text: "Option 2", disabled: true },
        { text: "Option 3" }
      ]
    }
  });
</script>

---

### Animations

<div id="example8"></div>

```javascript
  new SelectMadu({
    target: document.querySelector("#example8"),
    props: {
      animate: true,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu animate={true} datasource={datasource} />
```

<script>
  new SelectMadu({
    target: document.querySelector("#example8"),
    props: {
      animate: true,
      datasource: [
        { text: "Option 1" },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
</script>

---

### Custom components

{% include alert.html type="warning" title="Documentation work in progress." %}

<div id="example9"></div>

```javascript
  import IconListComponent from './IconListComponent';

  new SelectMadu({
    target: document.querySelector("#example9"),
    props: {
      datasource: [
        { text: "Option 1", optionComponent: IconListComponent },
        { text: "Option 2" },
        { text: "Option 3" }
      ]
    }
  });
```

```html
  <!-- Svelte -->
  <SelectMadu datasource={datasource} />
```

---
