import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ScrapeRequest {
  term: string;
  max_pages?: number;
  until_date?: string; // ISO date string, e.g., "2024-11-05"
}

interface ListingResult {
  title: string;
  normalized_title: string;
  sell_date: string | null;
  sell_price: number | null;
  auth_guarantee: boolean;
  psa_vault: boolean;
  url: string | null;
  image: string | null;
}

Deno.serve(async (req) => {
  let term: string | undefined;

  try {
    // Get term and parameters from request
    const requestBody = await req.json();
    term = requestBody.term;
    const maxPagesParam = requestBody.max_pages;
    const untilDateParam = requestBody.until_date;

    if (!term) {
      return new Response(
        JSON.stringify({ error: "Missing 'term' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build mode description for logging
    const modeParts = [];
    if (maxPagesParam) modeParts.push(`max ${maxPagesParam} pages`);
    if (untilDateParam) modeParts.push(`until ${untilDateParam}`);
    const modeDescription = modeParts.length > 0 ? modeParts.join(', ') : 'default (max 10 pages)';

    console.log(`Scraping eBay for term: ${term}, mode: ${modeDescription}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get scrape-ebay-page function URL
    const functionUrl = Deno.env.get("SUPABASE_URL")!.replace("https://", "");
    const scrapePageUrl = `https://${functionUrl}/functions/v1/scrape-ebay-page`;
    const authHeader = req.headers.get("authorization") || "";

    // Calculate date boundaries for counting results on yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Today at midnight
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Yesterday at midnight (last full day)

    // Determine stop date and max pages
    let stopDate: Date | null = null;
    let maxPages: number;

    if (untilDateParam) {
      stopDate = new Date(untilDateParam);
      stopDate.setHours(0, 0, 0, 0); // Set to midnight
      maxPages = maxPagesParam || 100; // High default when using until_date
      if (maxPagesParam) {
        console.log(`Will scrape up to ${maxPages} pages or until finding results before ${stopDate.toISOString()}`);
      } else {
        console.log(`Will scrape until finding results before ${stopDate.toISOString()} (max ${maxPages} pages)`);
      }
    } else {
      maxPages = maxPagesParam || 10; // Default to 10 pages when no until_date
      console.log(`Will scrape up to ${maxPages} pages`);
    }

    // Scrape multiple pages
    const allListings: ListingResult[] = [];
    let foundOlderResults = false;
    let stoppedDueToEmptyPage = false;

    for (let page = 1; page <= maxPages; page++) {
      console.log(`\nScraping page ${page} (max ${maxPages})`);

      // Call scrape-ebay-page function
      const pageResponse = await fetch(scrapePageUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          term,
          page,
          max_retries: 3,
        }),
      });

      const pageResult = await pageResponse.json();

      if (!pageResponse.ok || !pageResult.success) {
        console.error(`Error scraping page ${page}:`, pageResult.error);
        // Treat as empty page to stop scraping
        break;
      }

      const pageListings: ListingResult[] = pageResult.listings || [];
      allListings.push(...pageListings);

      console.log(`Parsed ${allListings.length} total valid sold listings so far`);

      // Stop if page had 0 items
      if (pageListings.length === 0) {
        console.log(`Page ${page} returned 0 items, stopping pagination`);
        stoppedDueToEmptyPage = true;
        break;
      }

      // Check if we should stop based on until_date
      if (stopDate) {
        const hasOlderResults = allListings.some((l) => {
          if (!l.sell_date) return false;
          const listingDate = new Date(l.sell_date);
          return listingDate < stopDate;
        });

        if (hasOlderResults) {
          console.log(`Found results from before until_date (${stopDate.toISOString()}), stopping at page ${page}`);
          foundOlderResults = true;
          break;
        }
      }

      // Add a small delay between pages to avoid overwhelming eBay
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 700 + Math.round(Math.random() * 500)));
      }
    }

    let completionMessage: string;
    if (stoppedDueToEmptyPage) {
      completionMessage = `stopped due to empty page`;
    } else if (foundOlderResults) {
      completionMessage = `stopped after finding results before until_date`;
    } else {
      completionMessage = `completed all ${maxPages} pages`;
    }
    console.log(`\nCompleted scraping (${completionMessage}), found ${allListings.length} total listings`);

    // Count how many results were on the last full day (yesterday)
    const numOnDay = allListings.filter((l) => {
      if (!l.sell_date) return false;
      const listingDate = new Date(l.sell_date);
      return listingDate >= yesterday && listingDate < today;
    }).length;

    // Create scrape record
    const { data: scrapeData, error: scrapeError } = await supabase
      .from("scrapes")
      .insert({
        term,
        num_results: allListings.length,
        num_on_day: numOnDay,
      })
      .select()
      .single();

    if (scrapeError) {
      throw new Error(`Failed to create scrape record: ${scrapeError.message}`);
    }

    console.log(`Created scrape record with ID: ${scrapeData.id}`);

    // Insert scrape results
    if (allListings.length > 0) {
      const scrapeResults = allListings.map((listing) => ({
        scrape_id: scrapeData.id,
        title: listing.title,
        normalized_title: listing.normalized_title,
        sell_date: listing.sell_date, // Already in ISO format from scrape-ebay-page
        sell_price: listing.sell_price,
        auth_guarantee: listing.auth_guarantee,
        psa_vault: listing.psa_vault,
        url: listing.url,
        image: listing.image,
      }));

      const { error: resultsError } = await supabase
        .from("scrape_results")
        .insert(scrapeResults);

      if (resultsError) {
        throw new Error(`Failed to insert scrape results: ${resultsError.message}`);
      }

      console.log(`Inserted ${scrapeResults.length} scrape results`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scrape_id: scrapeData.id,
        term,
        max_pages: maxPages,
        until_date: untilDateParam || null,
        stopped_early: foundOlderResults || stoppedDueToEmptyPage,
        stop_reason: stoppedDueToEmptyPage ? 'empty_page' : (foundOlderResults ? 'reached_until_date' : 'max_pages'),
        num_results: allListings.length,
        num_on_day: numOnDay,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-ebay:", error);

    // Try to save error to database if we have a term
    if (term) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("scrapes").insert({
          term,
          num_results: 0,
          num_on_day: 0,
          error: error.message,
        });
      } catch (dbError) {
        console.error("Failed to save error to database:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
