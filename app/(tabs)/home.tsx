import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, PanResponder, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collectionCards, portfolioData as fullPortfolioData, getTopMovers } from '@/constants/portfolio-data';

type TrendPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
type SortBy = 'name' | 'grade' | 'price';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const [portfolioTrend, setPortfolioTrend] = useState<TrendPeriod>('month');
  const [chartWidth, setChartWidth] = useState(320);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Sort cards based on selected sort method
  const getSortedCards = () => {
    const sorted = [...collectionCards];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'grade':
        return sorted.sort((a, b) => parseInt(b.grade) - parseInt(a.grade)); // Higher grade first
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[$,]/g, ''));
          const priceB = parseInt(b.price.replace(/[$,]/g, ''));
          return priceB - priceA; // Higher price first
        });
      default:
        return sorted;
    }
  };

  const sortedCards = getSortedCards();

  const trendButtons: { label: string; value: TrendPeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'All', value: 'all' },
  ];

  // Get data based on trend period
  const getPortfolioData = () => {
    // 200 points over 3 years (each point ≈ 5.5 days)
    // Day = last 1-2 points (approx last 5-10 days)
    // Week = last 15 points (approx last 80 days)
    // Month = last 30 points (approx last 165 days)
    // Year = last 70 points (approx last 385 days / 1 year)
    // All = all 200 points (3 years)
    const data = {
      day: fullPortfolioData.slice(-2),
      week: fullPortfolioData.slice(-15),
      month: fullPortfolioData.slice(-30),
      year: fullPortfolioData.slice(-70),
      all: fullPortfolioData,
    };
    return data[portfolioTrend];
  };

  const { gainers, losers } = getTopMovers();

  const portfolioDataPoints = getPortfolioData();
  const portfolioValues = portfolioDataPoints.map(dp => dp.value);
  const minValue = Math.min(...portfolioValues);
  const maxValue = Math.max(...portfolioValues);

  // Generate smart Y-axis ticks (4-6 ticks with nice round numbers)
  const generateYAxisTicks = () => {
    const range = maxValue - minValue;
    // Intervals from smallest to largest: 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000
    const intervals = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    let tickInterval = 1;

    // Find the best interval that gives us 4-6 ticks
    for (const interval of intervals) {
      const numTicks = Math.ceil(range / interval);
      if (numTicks >= 4 && numTicks <= 6) {
        tickInterval = interval;
        break;
      }
    }

    const ticks = [];
    const startTick = Math.floor(minValue / tickInterval) * tickInterval;
    for (let i = startTick; i <= maxValue + tickInterval; i += tickInterval) {
      ticks.push(i);
    }
    return ticks.slice(0, 6); // Max 6 ticks
  };

  // Generate smart X-axis ticks based on time period
  const generateXAxisTicks = () => {
    const dataLength = portfolioDataPoints.length;

    if (dataLength === 0) return ['Now'];

    const firstDate = portfolioDataPoints[0].date;
    const lastDate = portfolioDataPoints[dataLength - 1].date;

    const labels = {
      week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      month: ['1w', '2w', '3w', '4w', 'Now'],
      year: ['Jan', 'Apr', 'Jul', 'Oct', 'Now'],
      all: ['6m', '1y', '1.5y', '2y', '2.5y', '3y'],
    };
    return labels[portfolioTrend] || ['0', '25%', '50%', '75%', 'Now'];
  };

  const yAxisTicks = generateYAxisTicks();
  const xAxisLabels = generateXAxisTicks();
  const dataRange = maxValue - minValue;

  // Extract dates from the data points
  const datesTooltips = portfolioDataPoints.map(dp => dp.date);

  // Total portfolio value (sum of all cards)
  const totalPortfolioValue = collectionCards.reduce((sum, card) => {
    const price = parseInt(card.price.replace(/[$,]/g, ''));
    return sum + price;
  }, 0);


  return (
    <ScrollView scrollEnabled={scrollEnabled} style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ThemedText style={{ fontSize: 11, fontWeight: '500', opacity: 0.6 }}>komp</ThemedText>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.tabIconDefault, opacity: 0.3 }} />
        </View>
      </ThemedView>

      {/* Portfolio Cards List */}
      <ThemedView style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Collection Overview
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Sort Button */}
            <Pressable
              style={{ padding: 8 }}
              onPress={() => setSortMenuVisible(!sortMenuVisible)}
            >
              <ThemedText style={{ fontSize: 12, color: '#001f3f', fontWeight: '600', opacity: 0.7 }}>
                Sort: {sortBy === 'name' ? 'A-Z' : sortBy === 'grade' ? 'Grade' : 'Price'}
              </ThemedText>
            </Pressable>

            {/* Up/Down Icon */}
            <View style={{ alignItems: 'center', gap: 1, opacity: 0.5 }}>
              <View style={{ width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderBottomWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.text }} />
              <View style={{ width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.text }} />
            </View>
          </View>
        </View>


        {/* Cards Table - Scrollable */}
        <View style={{ marginTop: 12, marginHorizontal: -16, maxHeight: 165 }}>
          <ScrollView scrollEnabled showsVerticalScrollIndicator={true}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault }}>
              <ThemedText style={[styles.tableHeader, { flex: 1.5, fontSize: 9 }]}>Card</ThemedText>
              <ThemedText style={[styles.tableHeader, { flex: 1.5, fontSize: 9 }]}>Set</ThemedText>
              <ThemedText style={[styles.tableHeader, { flex: 0.8, textAlign: 'center', fontSize: 9 }]}>Grade</ThemedText>
              <ThemedText style={[styles.tableHeader, { flex: 1.2, textAlign: 'right', fontSize: 9 }]}>Latest Sale</ThemedText>
            </View>

            {/* Cards List */}
            {sortedCards.map((card, idx) => (
              <View key={idx} style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault, alignItems: 'center' }}>
                <ThemedText style={[styles.tableCell, { flex: 1.5, fontSize: 10 }]}>{card.name}</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1.5, fontSize: 9, opacity: 0.7 }]}>{card.set}</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 0.8, textAlign: 'center', fontSize: 10 }]}>{card.grade}</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontSize: 10 }]}>{card.price}</ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>
      </ThemedView>

      {/* Portfolio Value Trend */}
      <ThemedView style={styles.section}>
        {/* Trend Period Buttons */}
        <View style={styles.trendButtons}>
          {trendButtons.map(button => (
            <Pressable
              key={button.value}
              style={[
                styles.trendButton,
                portfolioTrend === button.value && { borderBottomWidth: 2, borderBottomColor: colors.tint },
              ]}
              onPress={() => setPortfolioTrend(button.value)}>
              <ThemedText
                style={[
                  styles.trendButtonText,
                  portfolioTrend === button.value && { color: colors.tint, fontWeight: '600' },
                ]}>
                {button.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Line Chart */}
        <ThemedView style={[styles.lineChartContainer, { borderColor: colors.tabIconDefault }]}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {/* Y-axis labels */}
            <View style={{ width: 40, paddingRight: 8, justifyContent: 'space-between', paddingVertical: 16 }}>
              {yAxisTicks.slice().reverse().map((tick, idx) => (
                <ThemedText key={`y-tick-${idx}`} style={[styles.axisLabel, { fontSize: 8 }]}>
                  ${tick}
                </ThemedText>
              ))}
            </View>

            <View style={{ flex: 1 }}>
              <View
                style={[styles.lineChart, { height: 280, position: 'relative' }]}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setChartWidth(width);
                }}
                onTouchMove={(e) => {
                  const x = e.nativeEvent.locationX;
                  setTouchX(x);

                  // Find closest data point
                  const usableWidth = Math.max(chartWidth - 20, 1);
                  const xPercent = x / usableWidth;
                  const closestIdx = Math.round(xPercent * (portfolioValues.length - 1));
                  setSelectedIndex(Math.max(0, Math.min(closestIdx, portfolioValues.length - 1)));
                }}
                onTouchStart={(e) => {
                  setScrollEnabled(false);
                  const x = e.nativeEvent.locationX;
                  setTouchX(x);

                  const usableWidth = Math.max(chartWidth - 20, 1);
                  const xPercent = x / usableWidth;
                  const closestIdx = Math.round(xPercent * (portfolioValues.length - 1));
                  setSelectedIndex(Math.max(0, Math.min(closestIdx, portfolioValues.length - 1)));
                }}
                onTouchEnd={() => {
                  setScrollEnabled(true);
                  setTouchX(null);
                  setSelectedIndex(null);
                }}
              >
                {/* Line segments connecting points */}
                {portfolioValues.slice(0, -1).map((value, idx) => {
                  const nextValue = portfolioValues[idx + 1];
                  const containerHeight = 260;
                  const usableWidth = Math.max(chartWidth - 20, 1); // Leave 20px margin

                  const x1 = (idx / (portfolioValues.length - 1)) * usableWidth;
                  const y1 = ((maxValue - value) / dataRange) * containerHeight + 10;
                  const x2 = ((idx + 1) / (portfolioValues.length - 1)) * usableWidth;
                  const y2 = ((maxValue - nextValue) / dataRange) * containerHeight + 10;

                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return (
                    <View
                      key={`line-${idx}`}
                      style={{
                        position: 'absolute',
                        left: x1,
                        top: y1,
                        width: length,
                        height: 2,
                        backgroundColor: colors.tint,
                        transformOrigin: '0 50%',
                        transform: [{ rotate: `${angle}deg` }],
                      }}
                    />
                  );
                })}

                {/* Dots at each point */}
                {portfolioValues.map((value, idx) => {
                  const containerHeight = 260;
                  const usableWidth = Math.max(chartWidth - 20, 1); // Leave 20px margin
                  const x = (idx / (portfolioValues.length - 1)) * usableWidth;
                  const y = ((maxValue - value) / dataRange) * containerHeight + 10;

                  return (
                    <View
                      key={`dot-${idx}`}
                      style={{
                        position: 'absolute',
                        left: x - 2,
                        top: y - 2,
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.tint,
                      }}
                    />
                  );
                })}

                {/* Touch indicator - vertical line */}
                {touchX !== null && (
                  <View
                    style={{
                      position: 'absolute',
                      left: touchX,
                      top: 0,
                      width: 1,
                      height: 260,
                      backgroundColor: colors.tint,
                      opacity: 0.5,
                    }}
                  />
                )}

                {/* Highlight selected data point */}
                {selectedIndex !== null && (
                  <View
                    style={{
                      position: 'absolute',
                      left: ((selectedIndex / (portfolioValues.length - 1)) * Math.max(chartWidth - 20, 1)) - 6,
                      top:
                        ((maxValue - portfolioValues[selectedIndex]) / dataRange) * 260 + 10 - 6,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: colors.tint,
                      backgroundColor: colors.background,
                    }}
                  />
                )}

                {/* Tooltip with data point value */}
                {selectedIndex !== null && touchX !== null && (
                  <View
                    style={{
                      position: 'absolute',
                      left: Math.max(10, Math.min(touchX - 40, chartWidth - 100)),
                      top: 10,
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.tint,
                      borderRadius: 4,
                      padding: 8,
                    }}
                  >
                    <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#001f3f' }}>
                      ${portfolioValues[selectedIndex]}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 10, color: '#999999', marginTop: 4 }}>
                      {datesTooltips[selectedIndex]?.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* X-axis labels - same spacing as data points */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0, marginTop: 12 }}>
                {xAxisLabels.map((label, idx) => (
                  <ThemedText key={`x-tick-${idx}`} style={[styles.axisLabel, { flex: 1, textAlign: 'center' }]}>
                    {label}
                  </ThemedText>
                ))}
              </View>
            </View>
          </View>
        </ThemedView>
      </ThemedView>

      {/* Top Gainers */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Top Gainers
        </ThemedText>
        <ThemedText style={styles.subsectionSubtitle}>
          Cards with biggest price increases (30d)
        </ThemedText>

        {/* Gainers List */}
        {gainers.map((card, idx) => (
          <View key={`gainer-${idx}`} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault, opacity: 0.9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <ThemedText style={{ fontSize: 12, color: '#10b981', fontWeight: '600', width: 18 }}>
                  {idx + 1}.
                </ThemedText>
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '500' }}>{card.name}</ThemedText>
                  <ThemedText style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{card.set}</ThemedText>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                  ${Math.round(card.priceStart)} → ${Math.round(card.priceEnd)}
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ThemedText style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>
                    {card.change}
                  </ThemedText>
                  <ThemedText style={{ color: '#10b981', fontSize: 11, opacity: 0.8 }}>
                    {card.percentChange.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ThemedView>

      {/* Top Losers */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Top Losers
        </ThemedText>
        <ThemedText style={styles.subsectionSubtitle}>
          Cards with biggest price decreases (30d)
        </ThemedText>

        {/* Losers List */}
        {losers.map((card, idx) => (
          <View key={`loser-${idx}`} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault, opacity: 0.9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <ThemedText style={{ fontSize: 12, color: '#ef4444', fontWeight: '600', width: 18 }}>
                  {idx + 1}.
                </ThemedText>
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '500' }}>{card.name}</ThemedText>
                  <ThemedText style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{card.set}</ThemedText>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>
                  ${Math.round(card.priceStart)} → ${Math.round(card.priceEnd)}
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ThemedText style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>
                    {card.change}
                  </ThemedText>
                  <ThemedText style={{ color: '#ef4444', fontSize: 11, opacity: 0.8 }}>
                    {card.percentChange.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ThemedView>

      <View style={{ height: 24 }} />

      {/* Floating Sort Menu */}
      {sortMenuVisible && (
        <>
          {/* Overlay to close menu when tapped */}
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setSortMenuVisible(false)}
          />

          {/* Menu Window */}
          <View style={{
            position: 'absolute',
            top: 120,
            right: 16,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.tabIconDefault,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 1000,
            overflow: 'hidden',
          }}>
            <Pressable
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault }}
              onPress={() => {
                setSortBy('name');
                setSortMenuVisible(false);
              }}
            >
              <ThemedText style={{ fontSize: 12, fontWeight: sortBy === 'name' ? '600' : '400' }}>
                Alphabetical (A-Z)
              </ThemedText>
            </Pressable>
            <Pressable
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.tabIconDefault }}
              onPress={() => {
                setSortBy('grade');
                setSortMenuVisible(false);
              }}
            >
              <ThemedText style={{ fontSize: 12, fontWeight: sortBy === 'grade' ? '600' : '400' }}>
                Grade (High to Low)
              </ThemedText>
            </Pressable>
            <Pressable
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              onPress={() => {
                setSortBy('price');
                setSortMenuVisible(false);
              }}
            >
              <ThemedText style={{ fontSize: 12, fontWeight: sortBy === 'price' ? '600' : '400' }}>
                Price (High to Low)
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.5,
    fontSize: 13,
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  chartValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  lineChartContainer: {
    marginBottom: 24,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  lineChart: {
    height: 150,
  },
  chartArea: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  axisLabel: {
    fontSize: 10,
    opacity: 0.5,
    fontWeight: '400',
  },
  trendButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  trendButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  trendButtonText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  subsectionSubtitle: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
    marginBottom: 16,
  },
  marketMoversList: {
    gap: 0,
  },
  moverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  moverRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardSubtext: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
  },
  tableHeader: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tableCell: {
    fontSize: 12,
    fontWeight: '400',
  },
});
