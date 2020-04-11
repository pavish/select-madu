---
title: Select Madu - Getting started
permalink: /getting-started
---

# Getting started

## Installation

### Manual
Include the bundled javascript file and css file from the [bundle folder][bundle-folder-url].

```html
<head>
  <script type="text/javascript" src="selectmadu.min.js"></script>
  <link rel="stylesheet" href="selectmadu.css">
</head>
```

### NPM
You can install SelectMadu from npm using the following command.

```bash
npm install select-madu --save
```
and then import it in your javascript file
```javascript
import SelectMadu from 'select-madu';
```

Note: CSS file has to be included separately

### Svelte
Optionally, if you are using Svelte you can import SelectMadu as a component.

```javascript
import SelectMadu from 'select-madu';

<SelectMadu/>
```

Note: CSS file has to be included separately

## Basic usage

### Simple select menu
```javascript
  import SelectMadu from 'select-madu';

  //To create
  let instance = new SelectMadu({
    //SelectMadu dom elements will be rendered within the specified parent element in target.
    target: document.querySelector("#parentElement"),

    //Properties for initializing SelectMadu. Refer Properties info below.
    props: {
      datasource: [
        { text: "Ferrai" }, 
        { text: "Lamborghini" },
        { text: "Aston Martin" }
      ]
    }
  });

  //To destroy and remove
  instance.$destroy();
```

## Read more
* Check out the properties and methods available in the [API documentation page][api-document-page-url]
* Find usage examples in the [examples page][example-page-url]

[bundle-folder-url]: https://github.com/pavish/select-madu/tree/master/bundle
[example-page-url]: /select-madu/examples
[api-document-page-url]: /select-madu/api
