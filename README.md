# SelectMadu
=============
SelectMadu is a replacement for the select menu, with support for searching, multiple selections, async data loading and more.

## Features
-----------
* Searching select options.
* Multi-select interface with tags.
* Data can be provided as an array.
* Async data load as a function returing promise, for AJAX or for any async opertion.
* Dynamic changing of data.
* Multi-level Nesting options as groups.

## Getting started
-------------------
Look at the [docs folder][docs-folder-url] for examples on how to use SelectMadu.

### Install
You can install SelectMadu from npm using the following command

```bash
npm install --save select-madu
```

You can also directly include the bundled javascript file and css file from the [bundle folder][bundle-folder-url].

```html
<head>
  <script type="text/javascript" src="selectmadu.min.js"></script>
  <link rel="stylesheet" href="selectmadu.css">
</head>
```

Optionally, if you are using Svelte you can import SelectMadu as a component.

```javascript
import SelectMadu from 'SelectMadu';

<SelectMadu/>
```

### Basic usage
```javascript
  new SelectMadu({
     <!-- SelectMadu dom elements will be rendered within the specified parent element in target. -->
    target: document.querySelector("#parentElement"),

    <!-- Properties for initializing SelectMadu. Refer Properties info below. -->
    props: {
      datasource: [
        { text: "Ferrai" }, 
        { text: "Volkswagen group", children: [{ text: "Audi" }, { text: "Lamborghini" } ] },
        { text: "BMW" }
      ]
    }
  });
```

## Properties
--------------
SelectMadu can be initialized with the following properties

|      Property      | Required | Default Value | Description |
| :----------------: | :------: | :-----------: | :---------: |
|    `datasource`    |          |     `'/'`     |             |

## API Methods
--------------

|      Method        |  Description |
| :----------------: |  :---------: |
|    `getSelected`   |              |

## Documentation
-----------------
All documentation can be found within the [docs folder][docs-folder-url]


[docs-folder-url]: https://github.com/pavish/select-madu/tree/master/docs