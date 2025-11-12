import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ApifyClient } from "npm:apify-client@2";

interface ScrapePageRequest {
  term: string;
  page: number;
  max_retries?: number;
}

interface ListingResult {
  title: string;
  normalized_title: string;
  sell_date: Date | null;
  sell_price: number | null;
  auth_guarantee: boolean;
  psa_vault: boolean;
  url: string | null;
  image: string | null;
}

async function scrapePage(
  term: string,
  page: number,
  apifyToken: string
): Promise<ListingResult[]> {
  console.log(`Scraping page ${page} for term: ${term} using Apify actor`);

  // Initialize Apify client
  const client = new ApifyClient({
    token: apifyToken,
  });

  // Prepare actor input
  const input = {
    term: term,
    startPage: page,
    endPage: page,
    maxRequestsPerCrawl: 10,
  };

  console.log("Calling Apify actor with input:", JSON.stringify(input));

  // Run the actor and wait for it to finish
  const run = await client.actor("ejtCQT5GeYbWjAi7U").call(input);

  console.log(`Actor run completed with status: ${run.status}`);

  // Fetch results from the dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`Retrieved ${items.length} items from Apify actor`);

  // Log first item for debugging
  if (items.length > 0) {
    //console.log("First item from Apify:", JSON.stringify(items[0], null, 2));
  }

  // Convert to our ListingResult format
  const listings: ListingResult[] = items.map((item: any, index: number) => {
    /*
    console.log(`Processing item ${index}:`, {
      title: item.title?.substring(0, 50),
      sell_date: item.sell_date,
      sell_date_type: typeof item.sell_date,
      sell_price: item.sell_price,
    });
    */

    return {
      title: item.title,
      normalized_title: item.normalized_title,
      sell_date: new Date(item.sell_date),
      sell_price: item.sell_price,
      auth_guarantee: item.auth_guarantee,
      psa_vault: item.psa_vault,
      url: item.url,
      image: item.image,
    };
  });

  console.log(`Converted ${listings.length} listings`);
  return listings;
}

async function scrapePageWithRetry(
  term: string,
  page: number,
  apifyToken: string,
  maxRetries = 3
): Promise<ListingResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for page ${page}`);
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const listings = await scrapePage(term, page, apifyToken);
      return listings;
    } catch (error) {
      lastError = error;
      console.error(`Error scraping page ${page} (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
    }
  }

  // If we get here, all retries failed - return empty array to gracefully stop scraping
  console.log(`All retries failed for page ${page}, returning empty results`);
  return [];
}

Deno.serve(async (req) => {
  try {
    const requestBody: ScrapePageRequest = await req.json();
    const { term, page, max_retries = 3 } = requestBody;

    if (!term) {
      return new Response(
        JSON.stringify({ error: "Missing 'term' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (page === undefined || page === null) {
      return new Response(
        JSON.stringify({ error: "Missing 'page' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Apify token from environment
    const apifyToken = Deno.env.get("APIFY_TOKEN");
    if (!apifyToken) {
      return new Response(
        JSON.stringify({ error: "APIFY_TOKEN environment variable not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping page ${page} for term: ${term}`);

    // Scrape the page with retry logic
    const listings = await scrapePageWithRetry(term, page, apifyToken, max_retries);

    console.log(`Serializing ${listings.length} listings...`);

    // Convert dates to ISO strings for JSON serialization
    const serializedListings = listings.map((listing, index) => {
      console.log(`Serializing listing ${index}:`, {
        title: listing.title?.substring(0, 50),
        sell_date: listing.sell_date,
        sell_date_valid: listing.sell_date instanceof Date && !isNaN(listing.sell_date.getTime()),
      });

      let isoDate = null;
      try {
        isoDate = listing.sell_date?.toISOString() || null;
      } catch (error) {
        console.error(`Error converting date for listing ${index} (${listing.title?.substring(0, 30)}):`, error.message);
        console.error(`Date value:`, listing.sell_date);
      }

      return {
        ...listing,
        sell_date: isoDate,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        term,
        page,
        num_results: listings.length,
        listings: serializedListings,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-ebay-page:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
