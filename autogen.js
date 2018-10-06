/**
 * Automatically generate emojis based on emojipedia.org
 */

const fs = require("fs");
const axios = require('axios');
const puppeteer = require('puppeteer');
const rmdir = require('rimraf').sync;
const Builder = require( 'node-spritesheet' ).Builder;

const EMOJI_SERVER = "https://emojipedia.org/";
const EMOJI_CATEGORIES = {
    'people': `${EMOJI_SERVER}/people/`,
    'nature': `${EMOJI_SERVER}/nature/`,
    'food': `${EMOJI_SERVER}/food-drink/`,
    'activity': `${EMOJI_SERVER}/activity/`,
    'travel': `${EMOJI_SERVER}/travel-places/`,
    'objects': `${EMOJI_SERVER}/objects/`,
    'symbols': `${EMOJI_SERVER}/symbols/`,
    'flags': `${EMOJI_SERVER}/flags/`,
}

const flatten = (arr) => {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
  }


const fetchUrl = async (page, emojiUrl) => {
    console.log(emojiUrl);
    await page.goto(emojiUrl);
    const emoji = await page.evaluate(() => {
        const emoji = {};
        let vendors = document.querySelectorAll(".vendor-list ul li");
        vendors = Array.prototype.slice.call(vendors);

        // Sometimes browser information is stored as container
        // We make sure our vendors always have a name
        vendors = vendors.filter((vendorEl) => {
            return vendorEl.querySelector("h2 a");
        });

        vendors = vendors.map((vendorEl) => {
            const vendor = {};
            vendor.name = vendorEl.querySelector("h2 a").innerText;
            vendor.image = vendorEl.querySelector(".vendor-image img").src;
            return vendor;
        });

        emoji.vendors = vendors;

        const shortcodeEl = document.querySelector(".shortcodes li");
        if (shortcodeEl) {
            emoji.shortcode = shortcodeEl.innerText.match(/:(.+):/)[1];
        } else {
            emoji.shortcode = window.location.href.match(/emojipedia\.org\/(.+)\//)[1];
        }

        emoji.shortcode = "ea-";

        emoji.charcode = document.querySelector(".emoji-copy").value;
        return emoji;
    });

    return emoji;
}

const fetchCategory = async (page, categoryUrl) => {
    await page.goto(categoryUrl);
    const emojiUrls = await page.evaluate(() => {
        let emojis = document.querySelectorAll(".emoji-list li a");
        emojis = Array.prototype.slice.call(emojis);
        return emojis.map((el) => el.href);
    });

    const emojis = [];
    for (let emojiUrl of emojiUrls) {
        const emoji = await fetchUrl(page, emojiUrl);
        emojis.push(emoji);
    }

    return emojis;
}

const downloadEmoji = async (emoji) => {
    for (let vendor of emoji.vendors) {
        console.log("\t ->", vendor.name);
        const url = vendor.image;
        const path = `.tmp/${vendor.name.toLowerCase()}/${emoji.shortcode}.png`;

        if (vendor.name == "Apple" && !fs.existsSync(path)){
            const res = await axios.get(url, { responseType: 'stream' });
            res.data.pipe(fs.createWriteStream(path))
        }

    }
    return true;
}

(async () => {
    if (!fs.existsSync("emojis.json")) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const emojiCategories = [];
        for (let category in EMOJI_CATEGORIES) {
            const emojiCategory = await fetchCategory(page, EMOJI_CATEGORIES[category]);
            emojiCategories.push(emojiCategory);
        }
        fs.writeFileSync("emojis.json", JSON.stringify(emojiCategories, null, 4));
        await browser.close();
    }

    emojis = JSON.parse(fs.readFileSync("emojis.json"));

    rmdir(".tmp/");
    fs.mkdirSync(".tmp/");

    // Generate sheets based on vendors
    emojis = flatten(emojis);

    const vendors = emojis.reduce((vendors, emoji) => {
        emoji.vendors.forEach(newVendor => {
            if (vendors.indexOf(newVendor.name.toLowerCase()) === -1) {
                vendors.push(newVendor.name.toLowerCase());
            }
        });
        return vendors;
    }, []);

    vendors.forEach(vendor => fs.mkdirSync(`.tmp/${vendor.toLowerCase()}`));

    for (emoji of emojis) {
        console.log(`Downloading ${emoji.charcode} (${emoji.shortcode})`);
        await downloadEmoji(emoji);
    }
    console.log("Downloaded all emojis, generating spritesheets and css files");

    vendors.forEach((vendor) => {
        const builder = new Builder({
            outputDirectory: `dist/${vendor}`,
            outputImage: `${vendor}.emojis.png`,
            outputCss: `${vendor}.emojis.css`,
            selector: '.ea',
            images: fs.readdirSync(`.tmp/${vendor}`).map(path => `.tmp/${vendor}/${path}`)
        });

        builder.build(() => {
            console.log(`Built emoji spritesheet for ${vendor}`)
        });
    });
})();