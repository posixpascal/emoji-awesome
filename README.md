# Emoji Awesome

This is an alternative to [ziishaned/emoji-awesome](https://github.com/ziishaned/emoji-awesome). It automatically generates the image spritesheets from emojipedia.org using puppeteer and therefore is always up to date. 

It supports all common emoji vendors and produces CSS code that is mostly similar to emoji-awesome.

Currently it only supports PNG sprites, SVGs are planned in the near future.

## Quick install

### NPM

```bash
npm install @ychily/emoji-awesome
```

### Yarn

```bash
yarn add @ychily/emoji-awesome
```

## Usage

Just include the CSS file of the vendor you want to use and start using emojis :clap:

```html
<i class="em em-heart"></i>
<i class="em em-gift"></i>
<i class="em em-bell"></i>
<i class="em em-:shortcode:"></i>
```

## Source
The spritesheets are autogenerated using `autogen.js`,
this script is mostly using synchronous APIs at the moment and is therefore really slow (may take up to 4 hours currently to build all emojis). This uses `node-spritesheet` under the hood which unfortunately depends on a `grunt` dependency. We might fork node-spritesheet or make a contribution to fix this.

Emojis are cached in emojis.json, if emojipedia rolls out a new set of emojis just delete the file and rerun autogen.

## Documentation

## License

License tbd.