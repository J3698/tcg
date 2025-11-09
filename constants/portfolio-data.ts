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
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate deterministic portfolio data based on collection cards
 * Uses seeded random numbers so data stays consistent across sessions
 */
export function generatePortfolioData(): number[] {
  const points = 200;
  const collectionData: number[] = [];
  let randomSeed = 12345; // Fixed seed for deterministic generation

  // Generate individual price trends for each card
  const cardPrices = collectionCards.map(card => {
    const data: number[] = [];
    const cardCurrentPrice = parseInt(card.price.replace(/[$,]/g, ''));
    let price = cardCurrentPrice * 0.15; // Start at 15% of current value

    for (let i = 0; i < points; i++) {
      const progress = i / points;
      const baseTrend = cardCurrentPrice * 0.15 + progress * cardCurrentPrice * 0.85;

      // Larger daily swings: -15% to +15%
      const changePercent = (seededRandom(randomSeed++) - 0.5) * 30;
      price = price * (1 + changePercent / 100);

      // Random market events/spikes: 15% chance of significant move (±10% to ±25%)
      if (seededRandom(randomSeed++) < 0.15) {
        const eventSize = (seededRandom(randomSeed++) - 0.5) * 0.35;
        price = price * (1 + eventSize);
      }

      // Smooth towards trend: 92% momentum, 8% trend
      price = price * 0.92 + baseTrend * 0.08;

      // Prevent extreme outliers
      price = Math.max(cardCurrentPrice * 0.05, Math.min(cardCurrentPrice * 2.5, price));

      data.push(Math.round(price));
    }
    return data;
  });

  // Sum all card prices at each point to get total portfolio value
  for (let i = 0; i < points; i++) {
    let total = 0;
    cardPrices.forEach(cardData => {
      total += cardData[i];
    });
    collectionData.push(Math.round(total));
  }

  return collectionData;
}

// Pre-generate and cache the data
export const portfolioData = generatePortfolioData();
