import { tavily } from "@tavily/core";

export interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
  raw_content?: string | null;
}

export interface TavilySearchResponse {
  query: string;
  answer: string | null;
  results: TavilyResult[];
  response_time: number;
  request_id: string;
  follow_up_questions?: string[] | null;
  images?: string[];
}

const queryText = "What are the latest promotions fast foods promotion in Malaysia";

/**
 * Perform a search query on Tavily or mock it if DRY_RUN=true / no API key is present.
 */
export async function searchPromotions(): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  const isDryRun = process.env.DRY_RUN === "true";

  if (!apiKey || isDryRun) {
    console.log(`[Tavily Service] Running in ${!apiKey ? "MOCK (No API Key)" : "DRY RUN"} mode. Returning simulated data.`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      query: queryText,
      follow_up_questions: null,
      answer: "Here are the latest fast food promotions in Malaysia, featuring KFC RM12 weekday deals, Burger King Whopper Jr add-on offers, and Wallace Burger meal deals.",
      images: [],
      results: [
        {
          url: "https://www.syioknya.com/promotions/kfc-promotion",
          title: "KFC Promotion June 2026",
          content: "Syioknya Malaysia\n\n# KFC Promotion June 2026\n\nLatest KFC promotions in Malaysia — a live list of deals, vouchers and outlet-only offers. We update this page whenever offers change. Check dates, outlets and how to redeem. Last updated: 9 Jun 2026. KFC RM12 Combo: Weekday Deal - 4 Items for RM12 | June 2026. KFC Buy 1 Free 1 Promotion: Members' Day - Buy 1 Free 1 Selected Combos | 11-13 June 2026. KFC Seaweed Shaker Fries: New KFC Treats - From RM5.99.",
          score: 0.7295395,
          raw_content: null
        },
        {
          url: "https://www.syioknya.com/promotions/burger-king",
          title: "Burger King Promotion June 2026 - Syioknya Malaysia",
          content: "Food & Beverage (F&B) Promotions · Burger King International Burger Day Promotion: Add On Whopper Jr. for RM2 | 25 May - 6 June 2026. 24 May 2026. Expired",
          score: 0.62358373,
          raw_content: null
        },
        {
          url: "https://www.facebook.com/WallaceBurgerMY/posts/-3-burgers-for-rm1490-the-math-isnt-mathingor-2-spicy-chicken-wraps-fries-drink-/122296008926173647",
          title: "3 BURGERS FOR RM14.90?! The math isn't mathing. OR 2 Spicy ...",
          content: "Spicy Chicken Wraps + Fries + Drink ONLY RM13.90 valid for dine-in, takeaway and drive-thru only. • Offers available from 11am onwards.",
          score: 0.32514593,
          raw_content: null
        }
      ],
      response_time: 0.8,
      request_id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
  }

  // Live client call
  console.log("[Tavily Service] Executing search request on Tavily API...");
  const client = tavily({ apiKey });

  try {
    const response = await client.search(queryText, {
      searchDepth: "advanced",
      maxResults: 5, // fetch 5 for better result density, user wants at least 3
      timeRange: "month",
      country: "malaysia"
    });

    // Tavily client response could have different structures depending on version,
    // let's normalize it to ensure request_id and response_time are present.
    // If they are missing, we default them.
    const results = (response.results || [])
      .map((r: any) => ({
        url: r.url || "",
        title: r.title || "Untitled Deal",
        content: r.content || "",
        score: typeof r.score === "number" ? r.score : 0.5,
        raw_content: r.raw_content || null
      }))
      .filter((r: any) => r.score >= 0.40); // Only keep results with score >= 40%

    return {
      query: response.query || queryText,
      follow_up_questions: (response as any).followUpQuestions || (response as any).follow_up_questions || null,
      answer: response.answer || null,
      images: (response.images || []).map((img: any) => typeof img === "string" ? img : (img.url || "")),
      results: results,
      response_time: (response as any).responseTime || (response as any).response_time || 1.0,
      request_id: (response as any).requestId || (response as any).request_id || `tavily-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
  } catch (error: any) {
    console.error("[Tavily Service] Error fetching from Tavily:", error);
    throw error;
  }
}
