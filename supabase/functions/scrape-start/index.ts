import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { pokemons } from "./pokemon.ts";

interface Pokemon {
  index: string;
  name: string;
  type1: string;
  type2: string;
}

interface ScrapeResult {
  pokemon: string;
  success: boolean;
  scrape_id?: string;
  num_results?: number;
  num_on_day?: number;
  error?: string;
}

async function scrapePokemon(
  pokemon: Pokemon,
  scrapeEbayUrl: string,
  authHeader: string,
  untilDate: string
): Promise<ScrapeResult> {
  console.log(`Scraping Pokemon: ${pokemon.name}`);

  try {
    const response = await fetch(scrapeEbayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        term: pokemon.name,
        until_date: untilDate
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✓ Success for ${pokemon.name}: ${result.num_results} results`);
      return {
        pokemon: pokemon.name,
        success: true,
        scrape_id: result.scrape_id,
        num_results: result.num_results,
        num_on_day: result.num_on_day,
      };
    } else {
      console.error(`✗ Error for ${pokemon.name}:`, result.error);
      return {
        pokemon: pokemon.name,
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`✗ Exception for ${pokemon.name}:`, error.message);
    return {
      pokemon: pokemon.name,
      success: false,
      error: error.message,
    };
  }
}

Deno.serve(async (req) => {
  try {
    console.log("Starting scrape-start function");
    console.log(`Found ${pokemons.length} Pokemon to scrape`);

    // Calculate until_date: day before the last full day
    // If today is Nov 6, last full day is Nov 5, so until_date is Nov 4
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    //const untilDate = dayBeforeYesterday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const untilDate = "2025-10-01"//  dayBeforeYesterday.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    console.log(`Will scrape until ${untilDate} (day before last full day)`);

    // Get the scrape-ebay function URL
    const functionUrl = Deno.env.get("SUPABASE_URL")!.replace(
      "https://",
      ""
    );
    const scrapeEbayUrl = `https://${functionUrl}/functions/v1/scrape-ebay`;

    // Get authorization header from the current request
    const authHeader = req.headers.get("authorization") || "";

    console.log(`Will call scrape-ebay at: ${scrapeEbayUrl}`);

    // Scrape all Pokemon in parallel
    const scrapePromises = pokemons.slice(0, 20).map(pokemon =>
      scrapePokemon(pokemon, scrapeEbayUrl, authHeader, untilDate)
    );

    console.log(`Launching ${scrapePromises.length} parallel scrape requests...`);
    const results = await Promise.all(scrapePromises);

    // Count successes and errors
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`\n=== Scraping Complete ===`);
    console.log(`Total Pokemon: ${pokemons.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        total: pokemons.length,
        successful: successCount,
        errors: errorCount,
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-start:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
