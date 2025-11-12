import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const url = 'https://www.ebay.com/sch/i.html?_nkw=Charizard&_sacat=0&_from=R40&Graded=Yes&_dcat=183454&LH_Sold=1&LH_Complete=1&_ipg=500&rt=nc&LH_Auction=1&_pgn=1';
const cacheFile = 'ebay-cache.html';

async function scrapeEbay(useCache = true) {
  try {
    let html;

    // Check if cache exists and should be used
    if (useCache && existsSync(cacheFile)) {
      console.log('Loading from cache:', cacheFile);
      html = await readFile(cacheFile, 'utf-8');
      console.log(`Loaded ${html.length} characters from cache`);
    } else {
      console.log('Fetching URL:', url);

      // Fetch the HTML from eBay
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      html = await response.text();
      console.log(`Downloaded ${html.length} characters`);

      // Save to cache
      await writeFile(cacheFile, html, 'utf-8');
      console.log('Saved to cache:', cacheFile);
    }

    // Load HTML into Cheerio
    const $ = cheerio.load(html);
    console.log('HTML loaded into Cheerio successfully!');

    // Parse sold auction listings
    const listings = [];
    const items = $('.srp-results li.s-card');
    console.log(`\nFound ${items.length} total items`);

    items.each((index, elem) => {
      const $item = $(elem);

      // Extract title
      const title = $item.find('.s-card__title .su-styled-text').first().text().trim();

      // Extract sold date
      const soldText = $item.find('.s-card__caption .su-styled-text').first().text().trim();
      const sellDateMatch = soldText.match(/Sold\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/);
      const sellDate = sellDateMatch ? sellDateMatch[0].replace('Sold  ', '').replace('Sold ', '') : null;

      // Extract price
      const sellPrice = $item.find('.s-card__price').first().text().trim();

      // Check for Authenticity Guarantee
      const itemHtml = $item.html();
      const isGuarantee = itemHtml.includes('Authenticity Guarantee');

      // Check for PSA Vault
      const isVault = itemHtml.includes('PSA Vault') || itemHtml.includes('In the PSA Vault');

      // Only include items with valid title, date, and price
      if (title && sellDate && sellPrice) {
        listings.push({
          title,
          sellDate,
          sellPrice,
          isGuarantee,
          isVault
        });
      }
    });

    console.log(`Parsed ${listings.length} valid sold listings`);

    // Return the listings
    return listings;

  } catch (error) {
    console.error('Error scraping eBay:', error.message);
    throw error;
  }
}

// Run the scraper
scrapeEbay()
  .then(listings => {
    console.log('\n=== Sample Results ===');
    // Show first 5 listings
    listings.slice(0, 5).forEach((listing, index) => {
      console.log(`\n[${index + 1}]`);
      console.log(`  Title: ${listing.title.substring(0, 60)}...`);
      console.log(`  Sell Date: ${listing.sellDate}`);
      console.log(`  Sell Price: ${listing.sellPrice}`);
      console.log(`  Authenticity Guarantee: ${listing.isGuarantee}`);
      console.log(`  PSA Vault: ${listing.isVault}`);
    });

    console.log(`\n... and ${listings.length - 5} more listings`);

    // Return listings for further processing
    return listings;
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
