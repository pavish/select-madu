# SelectMadu
SelectMadu is a replacement for the select menu, with support for searching, multiple selections, async data loading and more.


## Features
* Searching select options.
* Multi-select interface with tags.
* Data can be provided as an array.
* Async data load as a function returing promise, for AJAX or for any async opertion.
* Dynamic changing of data.
* Multi-level nesting of options as groups.


## Getting started
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
  //To create
  let instance = new SelectMadu({
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

  //To destroy and remove
  instance.$destroy();
```


## API

### Properties
SelectMadu can be initialized with the following properties

|      Property      | Required | Default Value |                            Description                            |
| :----------------: | :------: | :-----------------------: | :-------------------------------------------------------------------: |
|    `datasource`    |     ✔    |            `[]`           |  Array or a function returning a Promise object for async loading     |
|     `selected`     |          | First value of datasource or undefined if not present | Object or array of selected objects |
|     `multiple`     |          |           `false`         |  If true, then multi selection will be used |
|     `search`       |          |           `true`          |  For enabling/disabling searching |
|     `textKey`      |          |           `"text"`          |  The key to use to display in the datasource result |
|     `valueKey`     |          |           `"text"`          |  The key to use to identify the value of the results in the datasource. |
|     `childKey`     |          |         `"children"`        |  The key to use to obtain the values of the nested optgroup |
|     `disabled`     |          |           `false`         |  If true, the instance will be disabled |

### Methods

|      Method        |                       Description                              |    Usage   |
| :----------------: | :------------------------------------------------------------: | :--------: |
|    `getSelected`   |  Returns the current selected value or values                  |  `instance.getSelected()`
|    `$set`          |  Use this method to set any of the properties dynamically.     |  `instance.$set('disabled', true)`
|    `$destroy`      |  Destroy the SelectMadu instance                               |  `instance.$destroy()`


## Documentation
All documentation can be found within the [docs folder][docs-folder-url]


## Contribute
Pull requests are encouraged and always welcome. Help make SelectMadu better!

To work on SelectMadu
```bash
git clone https://github.com/pavish/select-madu.git
cd select-madu
npm install
```

The component is written in [Svelte][svelte-url]. 
It's an awesome library, you should check it out!

SCSS is used for styling. It is separate from the component and is within styles folder.  

To build, run
```bash
npm run build
```

Build generates the dist folder which contains the es and umd variants for importing using npm.
The bundle folder is also generated which contains the iife variant with and without minimization.

You can also contribute by writing additional tests, adding issues that you encounter, or by helping with the documentation.


## License
[MIT](LICENSE)

[bundle-folder-url]: https://github.com/pavish/select-madu/tree/master/bundle
[docs-folder-url]: https://github.com/pavish/select-madu/tree/master/docs
[svelte-url]: https://svelte.dev/