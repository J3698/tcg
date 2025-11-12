//import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12?bundle";

interface ScrapeRequest {
  image_path: string;
}

interface PSACertData {
  CertNumber: string;
  GradeDescription: string;
  CardGrade: string;
  Subject: string;
  Year: string;
  Brand: string;
  Category: string;
}

interface PSAResponse {
  PSACert: PSACertData;
}

interface EbayListing {
  title: string;
  sell_date: string;
  sell_price: number;
  auth_guarantee: boolean;
  psa_vault: boolean;
  url: string | null;
  image: string | null;
}

async function extractCertNumberFromImage(imageUrl: string, openaiApiKey: string): Promise<string> {
  console.log("Calling OpenAI Vision API to extract cert number from image");
  console.log("Image URL:", imageUrl);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is an image of a PSA graded trading card. Please extract ONLY the certification number from the image. The cert number is typically a long number displayed on the PSA label. Return ONLY the number, nothing else.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const certNumber = data.choices[0].message.content.trim();
    console.log(`Extracted cert number: ${certNumber}`);

    return certNumber;
  } catch (error: any) {
    console.error("Error calling OpenAI Vision API:", error.message);
    throw error;
  }
}

async function fetchEbayPage(url: string, proxyUrl: string) {
  try {
    console.log(`Fetching eBay URL: ${url}`);
    console.log(`Using proxy: ${proxyUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

    const client = Deno.createHttpClient({
      proxy: { url: proxyUrl }
    });

    const response = await fetch(url, {
      client,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`eBay fetch error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Fetched eBay page, length: ${html.length} chars`);

    client.close();
    return html;
  } catch (error: any) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
}

async function fetchPSACard(certNumber: string, psaAccessToken: string) {
  const url = `https://api.psacard.com/publicapi/cert/GetByCertNumber/${certNumber}`;
  console.log(`Fetching PSA cert from API: ${certNumber}`);

  try {
    const response = await fetch(url, {
      headers: {
        authorization: `bearer ${psaAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`PSA API error: ${response.status} ${response.statusText}`);
    }

    const data: PSAResponse = await response.json();

    if (!data || !data.PSACert) {
      throw new Error("Invalid response from PSA API");
    }

    const psaCert = data.PSACert;
    const gradeDescription = psaCert.GradeDescription;
    const cardGrade = psaCert.CardGrade;
    const subject = psaCert.Subject;

    // Extract numeric grade from CardGrade (e.g., "MINT 9" -> "9")
    let grade = cardGrade;
    const gradeMatch = cardGrade.match(/\d+/);
    if (gradeMatch) {
      grade = gradeMatch[0];
    }

    if (!grade || !subject) {
      console.error("Failed to extract grade or subject from PSA API");
      console.log("API Response:", JSON.stringify(psaCert, null, 2));
      throw new Error("Could not extract PSA card details");
    }

    console.log(`\nPSA Card Details:`);
    console.log(`Cert Number: ${psaCert.CertNumber}`);
    console.log(`Grade: ${gradeDescription} (${grade})`);
    console.log(`Subject: ${subject}`);
    console.log(`Year: ${psaCert.Year}`);
    console.log(`Brand: ${psaCert.Brand}`);
    console.log(`Category: ${psaCert.Category}\n`);

    return { grade, subject, psaCert };
  } catch (error: any) {
    console.error(`Error fetching PSA card:`, error.message);
    if (error.response) {
      console.error("API Response:", error.response.status, error.response.data);
    }
    throw error;
  }
}

async function searchEbay(
  searchTerm: string,
  grade: string,
  proxyUrl: string
): Promise<EbayListing[]> {
  // Build eBay URL with parameters
  const params = new URLSearchParams({
    _nkw: searchTerm,
    _sacat: "0",
    _from: "R40",
    Graded: "Yes",
    LH_Sold: "1",
    LH_Complete: "1",
    _ipg: "120",
    LH_PrefLoc: "3",
    rt: "nc",
    LH_All: "1",
    Grade: grade,
    "Professional Grader": "Professional Sports Authenticator (PSA)",
    _dcat: "183454",
  });

  const url = `https://www.ebay.com/sch/i.html?${params.toString()}`;
  console.log(`Fetching eBay results: ${url}\n`);

  const html = await fetchEbayPage(url, proxyUrl);

  // Check if response is too short (blocked)
  if (html.length < 20000) {
    throw new Error(`Response too short (${html.length} chars), likely blocked`);
  }

  const $ = cheerio.load(html);

  // Parse results using same logic as original script
  const listings: EbayListing[] = [];

  // Try multiple selectors
  let items = $(".srp-results li.s-item");
  if (items.length === 0) {
    console.log("Trying alternative selector: .s-item");
    items = $("li.s-item");
  }
  if (items.length === 0) {
    console.log("Trying alternative selector: .s-card");
    items = $(".srp-results li.s-card");
  }

  console.log(`Found ${items.length} total items\n`);

  items.each((index, elem) => {
    const $item = $(elem);

    // Extract title - works for both .s-item and .s-card
    let title = $item.find(".s-item__title").first().text().trim();
    if (!title) {
      title = $item.find(".s-card__title .su-styled-text").first().text().trim();
    }

    // Skip "Shop on eBay" items
    if (
      !title ||
      title.toLowerCase().includes("shop on ebay") ||
      title.toLowerCase().includes("comprar en ebay")
    ) {
      return;
    }

    // Extract sold date - support both English and Spanish formats
    let soldText =
      $item.find(".s-item__title--tag").text().trim() +
      " " +
      $item.find(".s-item__ended-date").text().trim();
    if (!soldText.trim()) {
      soldText = $item.find(".s-card__caption .su-styled-text").first().text().trim();
    }

    // Match English, Spanish, and Portuguese date formats
    const dateMatch = soldText.match(
      /(Sold|Vendido|Vendidos)\s+(\d{1,2}\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+\d{1,2},?\s+\d{4}/i
    );

    let sellDate: Date | null = null;
    if (dateMatch) {
      let dateStr = dateMatch[0].replace(/^(Sold|Vendido|Vendidos)\s+/i, "").trim();
      // Convert Spanish and Portuguese months to English
      const monthMap: Record<string, string> = {
        // Spanish
        ene: "Jan",
        feb: "Feb",
        mar: "Mar",
        abr: "Apr",
        may: "May",
        jun: "Jun",
        jul: "Jul",
        ago: "Aug",
        sep: "Sep",
        oct: "Oct",
        nov: "Nov",
        dic: "Dec",
        // Portuguese
        jan: "Jan",
        fev: "Feb",
        mai: "May",
        set: "Sep",
        out: "Oct",
        dez: "Dec",
      };
      for (const [foreign, english] of Object.entries(monthMap)) {
        dateStr = dateStr.replace(new RegExp("\\b" + foreign + "\\b", "i"), english);
      }
      sellDate = new Date(dateStr);
    }

    // Extract price - support both formats
    let sellPriceText = $item.find(".s-item__price").first().text().trim();
    if (!sellPriceText) {
      sellPriceText = $item.find(".s-card__price").first().text().trim();
    }

    let sellPrice: number | null = null;

    // Try USD/$ format first (period decimal separator)
    let priceMatch = sellPriceText.match(/(USD|US \$|\$)\s?([0-9,]+\.?\d*)/i);
    if (priceMatch) {
      sellPrice = parseFloat(priceMatch[2].replace(/,/g, ""));
    } else {
      // Try Brazilian Real or other formats (comma decimal separator)
      priceMatch = sellPriceText.match(/(R\$|€|£)\s?([0-9.]+,\d{2})/i);
      if (priceMatch) {
        // Convert Brazilian format: remove dots, replace comma with period
        const priceStr = priceMatch[2].replace(/\./g, "").replace(/,/, ".");
        sellPrice = parseFloat(priceStr);

        // Convert Brazilian Real to USD (approximate rate: 1 USD ≈ 5 BRL)
        if (priceMatch[1].toLowerCase().includes("r$")) {
          sellPrice = sellPrice / 5.0; // Approximate conversion
        }
      }
    }

    // Authenticity guarantee / PSA vault checks
    const itemHtml = $item.html() || "";
    const authGuarantee =
      itemHtml.includes("Authenticity Guarantee") || itemHtml.includes("Garantía de autenticidad");
    const psaVault = itemHtml.includes("PSA Vault") || itemHtml.includes("In the PSA Vault");

    // URL - support both formats
    let urlLink =
      $item.find("a.s-item__link").first().attr("href") ||
      $item.find("a.s-card__link").first().attr("href") ||
      null;
    if (urlLink && urlLink.startsWith("/")) {
      urlLink = new URL(urlLink, "https://www.ebay.com").href;
    }

    // Image - support both formats
    let image =
      $item.find("img.s-item__image-img").first().attr("src") ||
      $item.find("img.s-card__image").first().attr("src") ||
      null;
    if (image) {
      image = image.replace(/\/s-l\d+\.jpg/, "/s-l500.jpg");
    }

    if (title && sellDate && sellPrice !== null) {
      listings.push({
        title,
        sell_date: sellDate.toISOString(),
        sell_price: sellPrice,
        auth_guarantee: authGuarantee,
        psa_vault: psaVault,
        url: urlLink,
        image,
      });
    }
  });

  return listings;
}

Deno.serve(async (req) => {
  try {
    console.log("=== EDGE FUNCTION STARTED ===");

    const requestBody: ScrapeRequest = await req.json();
    console.log("Request body parsed:", requestBody);

    const { image_path } = requestBody;

    if (!image_path) {
      console.log("ERROR: Missing image_path parameter");
      return new Response(
        JSON.stringify({ error: "Missing 'image_path' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Image path:", image_path);

    // Configuration
    const psaAccessToken = "2rRQnpJHm4f8R-6Kjae-ZOE6A1tizwmW3NLl4P82MmS7awvYh8eKfVKKLm6p89lxxgboFJl83riqO456svAnjalLfugzTDus6P0uA2EowjRdyV17KQSf2bxhOQZ-zB4q2OJ03nEhbDhcLq1Hzue_Gn2yzNyX53ydIXji62pt9zdXB9Ch5LutPfvO8UUA1zHwBdos6PZuL-fD8Pe76mSt02uM1TUfUAoMytOVf8i8NKTAUc4Hh9uTyzZ0fqjrDPayfq7mgYYaWERkTYw0zoluuh4wRF5FksxkzuthKV22CjVOMLmF";
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const proxyHost = "gate.decodo.com";
    const proxyPort = "7000";
    const proxyUser = "sp6fntnf24";
    const proxyPass = "3xgn0DUd_rtmrWg9P8";

    // Setup proxy URL
    const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;

    console.log("Configuration loaded");

    // Initialize Supabase client
    console.log("Initializing Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized");

    console.log(`Starting scrape for image: ${image_path}`);

    // Step 1: Create signed URL for the image
    console.log("Step 1: Creating signed URL for image...");
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("cards")
      .createSignedUrl(image_path, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    if (!signedUrlData?.signedUrl) {
      throw new Error("No signed URL returned");
    }

    console.log("Signed URL created successfully");

    // Step 2: Extract cert number from image using OpenAI
    console.log("Step 2: Calling OpenAI to extract cert number...");
    const certNumber = await extractCertNumberFromImage(signedUrlData.signedUrl, openaiApiKey);
    console.log(`Cert number extracted: ${certNumber}`);

    // Step 3: Fetch PSA card details from API
    console.log("Step 3: Fetching PSA card details...");
    const { grade, subject, psaCert } = await fetchPSACard(certNumber, psaAccessToken);
    console.log(`PSA card fetched - Grade: ${grade}, Subject: ${subject}`);

    // Step 4: Search eBay with the extracted details
    console.log("Step 4: Searching eBay...");
    const listings = await searchEbay(subject, grade, proxyUrl);

    console.log(`Found ${listings.length} listings`);

    // Calculate statistics
    let avgPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;

    if (listings.length > 0) {
      avgPrice = listings.reduce((sum, l) => sum + l.sell_price, 0) / listings.length;
      minPrice = Math.min(...listings.map((l) => l.sell_price));
      maxPrice = Math.max(...listings.map((l) => l.sell_price));
    }

    return new Response(
      JSON.stringify({
        success: true,
        cert_number: certNumber,
        psa_card: {
          cert_number: psaCert.CertNumber,
          grade: psaCert.GradeDescription,
          grade_numeric: grade,
          subject: psaCert.Subject,
          year: psaCert.Year,
          brand: psaCert.Brand,
          category: psaCert.Category,
        },
        num_results: listings.length,
        listings,
        statistics: {
          average_price: avgPrice,
          min_price: minPrice,
          max_price: maxPrice,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("=== ERROR IN EDGE FUNCTION ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Upload an image to storage bucket 'cards'
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape-ebay-from-cert' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"image_path":"user-id/image-uuid.jpg"}'

*/
