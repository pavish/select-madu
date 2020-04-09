# SelectMadu

<a href="https://www.npmjs.com/package/select-madu">
  <img src="https://img.shields.io/npm/v/select-madu" alt="npm version">
</a>

<a href="https://github.com/pavish/select-madu/blob/master/LICENSE">
  <img src="https://img.shields.io/npm/l/select-madu" alt="license">
</a>

SelectMadu is a replacement for the select menu, with support for searching, multiple selections, async data loading and more.

To get started, checkout documentation and examples at https://pavishkrg.com/select-madu


## Features
* Searching select options.
* Multi-select interface with tags.
* Data can be provided as an array.
* Async data load as a function returing promise, for AJAX or for any async opertion.
* Dynamic changing of data.
* Multi-level nesting of options as groups.


## Installation and usage
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

Build generates the dist folder which contains the es and umd variants for importing using npm.
The bundle folder is also generated which contains the iife variant with and without minimization.

You can also contribute by writing additional tests, adding issues that you encounter, or by helping with the documentation.


## License
[MIT](LICENSE)

[bundle-folder-url]: https://github.com/pavish/select-madu/tree/master/bundle
[docs-folder-url]: https://github.com/pavish/select-madu/tree/master/docs
[svelte-url]: https://svelte.dev/
[select-madu-url]: https://pavishkrg.com/select-madu