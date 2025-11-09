/**
 * Hard-coded portfolio data for the collection
 * This data is stable across sessions and easily swappable for real data from an API
 */

export interface CollectionCard {
  name: string;
  set: string;
  grade: string;
  price: string;
}

export const collectionCards: CollectionCard[] = [
  { name: 'Charizard', set: 'Base Set', grade: '8', price: '$1,600' },
  { name: 'Blastoise', set: 'Base Set', grade: '8', price: '$1,200' },
  { name: 'Venusaur', set: 'Base Set', grade: '7', price: '$950' },
  { name: 'Pikachu', set: 'Base Set', grade: '9', price: '$2,100' },
  { name: 'Dragonite', set: 'Base Set', grade: '7', price: '$850' },
  { name: 'Gyarados', set: 'Base Set', grade: '8', price: '$1,400' },
  { name: 'Arcanine', set: 'Base Set', grade: '8', price: '$1,100' },
  { name: 'Alakazam', set: 'Base Set', grade: '7', price: '$950' },
  { name: 'Machamp', set: 'Base Set', grade: '9', price: '$1,950' },
  { name: 'Golem', set: 'Base Set', grade: '8', price: '$1,350' },
  { name: 'Flareon', set: 'Base Set', grade: '8', price: '$1,050' },
  { name: 'Lapras', set: 'Base Set', grade: '7', price: '$900' },
];

// Seed for deterministic random number generation
let randomSeed = 12345;
function seededRandom(): number {
  randomSeed = (randomSeed * 9301 + 49297) % 233280;
  return randomSeed / 233280;
}

/**
 * Generate deterministic portfolio data based on collection cards
 * Uses seeded random numbers so data stays consistent across sessions
 * Also returns individual card price histories
 */
export function generatePortfolioDataWithCards(): {
  portfolio: number[];
  cardPrices: Map<string, number[]>;
} {
  const points = 200;
  const collectionData: number[] = [];
  const cardPrices = new Map<string, number[]>();

  // Generate individual price trends for each card
  collectionCards.forEach((card, cardIdx) => {
    const data: number[] = [];
    const cardCurrentPrice = parseInt(card.price.replace(/[$,]/g, ''));
    let price = cardCurrentPrice * 0.15; // Start at 15% of current value

    for (let i = 0; i < points; i++) {
      const progress = i / points;
      const baseTrend = cardCurrentPrice * 0.15 + progress * cardCurrentPrice * 0.85;

      // Larger daily swings: -15% to +15%
      const changePercent = (seededRandom() - 0.5) * 30;
      price = price * (1 + changePercent / 100);

      // Random market events/spikes: 15% chance of significant move (±10% to ±25%)
      if (seededRandom() < 0.15) {
        const eventSize = (seededRandom() - 0.5) * 0.35;
        price = price * (1 + eventSize);
      }

      // Smooth towards trend: 92% momentum, 8% trend
      // Add variation: some cards have less upward bias than others
      const momentumFactor = 0.92 - (cardIdx % 3) * 0.05; // Some cards have 87%, 92% momentum
      const trendFactor = 1 - momentumFactor;
      price = price * momentumFactor + baseTrend * trendFactor;

      // Prevent extreme outliers
      price = Math.max(cardCurrentPrice * 0.05, Math.min(cardCurrentPrice * 2.5, price));

      data.push(Math.round(price));
    }
    cardPrices.set(card.name, data);
  });

  // Sum all card prices at each point to get total portfolio value
  for (let i = 0; i < points; i++) {
    let total = 0;
    cardPrices.forEach(cardData => {
      total += cardData[i];
    });
    collectionData.push(Math.round(total));
  }

  return { portfolio: collectionData, cardPrices };
}

// Pre-generate and cache the data
const { portfolio: portfolioData, cardPrices: cardPricesData } = generatePortfolioDataWithCards();
export { portfolioData, cardPricesData };

/**
 * Calculate top movers for the last month (80 data points)
 */
export interface TopMover {
  name: string;
  set: string;
  change: string;
  percentChange: number;
  priceStart: number;
  priceEnd: number;
  monthlyData: number[];
}

export function getTopMovers(): {
  gainers: TopMover[];
  losers: TopMover[];
} {
  const monthDataPoints = 80;
  const gainers: TopMover[] = [];
  const losers: TopMover[] = [];

  collectionCards.forEach(card => {
    const cardData = cardPricesData.get(card.name);
    if (!cardData) return;

    // Get last 80 points (1 month)
    const monthlyData = cardData.slice(-monthDataPoints);
    const priceStart = monthlyData[0];
    const priceEnd = monthlyData[monthlyData.length - 1];
    const change = priceEnd - priceStart;
    const percentChange = ((change / priceStart) * 100);

    const mover: TopMover = {
      name: card.name,
      set: card.set,
      change: `${change > 0 ? '+' : ''}$${Math.round(change)}`,
      percentChange,
      priceStart,
      priceEnd,
      monthlyData,
    };

    if (change >= 0) {
      gainers.push(mover);
    } else {
      losers.push(mover);
    }
  });

  // Sort by absolute change
  gainers.sort((a, b) => (b.priceEnd - b.priceStart) - (a.priceEnd - a.priceStart));
  losers.sort((a, b) => (a.priceEnd - a.priceStart) - (b.priceEnd - b.priceStart)); // More negative = bigger loss

  return {
    gainers: gainers.slice(0, 5),
    losers: losers.slice(0, 5),
  };
}
