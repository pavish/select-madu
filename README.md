# SelectMadu

<a href="https://www.npmjs.com/package/select-madu">
  <img src="https://img.shields.io/npm/v/select-madu" alt="npm version">
</a>

<a href="https://github.com/pavish/select-madu/blob/master/LICENSE">
  <img src="https://img.shields.io/npm/l/select-madu" alt="license">
</a>

<p></p>

SelectMadu is a replacement for the select menu, with support for searching, multiple selections, async data loading and more.

To get started, checkout documentation and examples at https://pavishkrg.com/select-madu


## Features
* Searching select options.
* Multi-select interface with tags.
* Async data load as a function returing promise, for AJAX or for any async opertion.
* Dynamic changing of data.
* Multi-level nesting of options as groups.


## Installation

### Manual
Download or source the javascript file and css file from any of the following links
* [jsDelivr][js-delivr-url]
* [unpkg][unpkg-url]

You can also download it directly from the [releases listed in select-madu repository][release-url]

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
Check out [Select madu home page][select-madu-url] for usage documentation and examples.


## API and Documentation
Check out [SelectMadu home page][select-madu-url] for detailed documentation with properties information and API methods.


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

Build generates the build folder, which contains the iife variant, with and without minimization
It also generates the nodesrc folder which contains the es and umd variants for importing the component within your svelte app.

You can also contribute by writing additional tests, adding issues that you encounter, or by helping with the documentation.


## License
[MIT](LICENSE)

[bundle-folder-url]: https://github.com/pavish/select-madu/tree/master/bundle
[docs-folder-url]: https://github.com/pavish/select-madu/tree/master/docs
[svelte-url]: https://svelte.dev/
[select-madu-url]: https://pavishkrg.com/select-madu

[js-delivr-url]: https://www.jsdelivr.com/package/npm/select-madu
[unpkg-url]: https://unpkg.com/browse/select-madu/dist/
[release-url]: https://github.com/pavish/select-madu/releases