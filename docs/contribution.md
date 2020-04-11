---
title: SelectMadu - Contribution
permalink: /contribution
---

# Contribution
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

Build generates the nodesrc folder which contains the es and umd variants for importing using npm.
Dist folder is generated containing the iife variant with and without minimization.
CSS is generated from SCSS and is present within the dist folder.

You can also contribute by writing additional tests, adding issues that you encounter, or by helping with the documentation.

[svelte-url]: https://svelte.dev/