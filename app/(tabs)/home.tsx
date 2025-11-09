import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collectionCards, portfolioData as fullPortfolioData, getTopMovers } from '@/constants/portfolio-data';

type TrendPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const [portfolioTrend, setPortfolioTrend] = useState<TrendPeriod>('month');

  const trendButtons: { label: string; value: TrendPeriod }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'All', value: 'all' },
  ];

  // Get data based on trend period
  const getPortfolioData = () => {
    // 200 points over 3 years
    // Day = last 8 points (approx last 44 days)
    // Week = last 40 points (approx last 220 days)
    // Month = last 80 points (approx last 440 days / 1.2 years)
    // Year = last 150 points (approx last 825 days / 2.25 years)
    // All = all 200 points (3 years)
    const data = {
      day: fullPortfolioData.slice(-8),
      week: fullPortfolioData.slice(-40),
      month: fullPortfolioData.slice(-80),
      year: fullPortfolioData.slice(-150),
      all: fullPortfolioData,
    };
    return data[portfolioTrend];
  };

  const { gainers, losers } = getTopMovers();

  const portfolioData = getPortfolioData();
  const minValue = Math.min(...portfolioData);
  const maxValue = Math.max(...portfolioData);

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
    const dataLength = portfolioData.length;
    const labels = {
      day: ['0h', '3h', '6h', '9h', '12h', 'Now'],
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

  // Total portfolio value (sum of all cards)
  const totalPortfolioValue = collectionCards.reduce((sum, card) => {
    const price = parseInt(card.price.replace(/[$,]/g, ''));
    return sum + price;
  }, 0);


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
          <View style={{ alignItems: 'center', gap: 1, opacity: 0.5 }}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderBottomWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.text }} />
            <View style={{ width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.text }} />
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
            {collectionCards.map((card, idx) => (
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
              <View style={[styles.lineChart, { height: 280 }]}>
                <View style={[styles.chartArea, { paddingRight: 16, paddingTop: 10, paddingBottom: 10 }]}>
                  {/* Draw lines */}
                  {portfolioData.map((value, idx, arr) => {
                    if (idx === arr.length - 1) return null;

                    const x1Percent = (idx / (arr.length - 1)) * 97;
                    const x2Percent = ((idx + 1) / (arr.length - 1)) * 97;
                    const y1 = 5 + ((maxValue - value) / dataRange) * 90;
                    const y2 = 5 + ((maxValue - arr[idx + 1]) / dataRange) * 90;

                    const dxPercent = x2Percent - x1Percent;
                    const dyPercent = y2 - y1;
                    const distance = Math.sqrt(dxPercent * dxPercent + dyPercent * dyPercent);
                    const angle = Math.atan2(dyPercent, dxPercent) * (180 / Math.PI);

                    return (
                      <View
                        key={`line-${idx}`}
                        style={{
                          position: 'absolute',
                          left: `${x1Percent}%`,
                          top: `${y1}%`,
                          width: `${distance}%`,
                          height: 2,
                          backgroundColor: colors.tint,
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: 'left center',
                        }}
                      />
                    );
                  })}

                  {/* Draw dots */}
                  {portfolioData.map((value, idx, arr) => {
                    const x = (idx / (arr.length - 1)) * 97;
                    const y = 5 + ((maxValue - value) / dataRange) * 90;

                    return (
                      <View
                        key={`dot-${idx}`}
                        style={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: `${y}%`,
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: colors.tint,
                          marginLeft: -1.5,
                          marginTop: -1.5,
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* X-axis labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 12 }}>
                {xAxisLabels.map((label, idx) => (
                  <ThemedText key={`x-tick-${idx}`} style={styles.axisLabel}>
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

        {/* Gainers Charts */}
        {gainers.map((card, idx) => {
          const gainerMinValue = Math.min(...card.monthlyData);
          const gainerMaxValue = Math.max(...card.monthlyData);
          const gainerRange = gainerMaxValue - gainerMinValue;

          return (
            <ThemedView key={`gainer-${idx}`} style={[styles.lineChartContainer, { borderColor: colors.tabIconDefault, marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                  <ThemedText type="defaultSemiBold">{card.name}</ThemedText>
                  <ThemedText style={styles.cardSubtext}>{card.set}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="defaultSemiBold" style={{ color: '#10b981' }}>
                    {card.change}
                  </ThemedText>
                  <ThemedText style={[styles.cardSubtext, { color: '#10b981' }]}>
                    {card.percentChange.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.lineChart, { height: 150 }]}>
                <View style={styles.chartArea}>
                  {/* Draw lines */}
                  {card.monthlyData.map((value, lineIdx, arr) => {
                    if (lineIdx === arr.length - 1) return null;

                    const x1Percent = (lineIdx / (arr.length - 1)) * 97;
                    const x2Percent = ((lineIdx + 1) / (arr.length - 1)) * 97;
                    const y1 = 5 + ((gainerMaxValue - value) / gainerRange) * 90;
                    const y2 = 5 + ((gainerMaxValue - arr[lineIdx + 1]) / gainerRange) * 90;

                    const dxPercent = x2Percent - x1Percent;
                    const dyPercent = y2 - y1;
                    const distance = Math.sqrt(dxPercent * dxPercent + dyPercent * dyPercent);
                    const angle = Math.atan2(dyPercent, dxPercent) * (180 / Math.PI);

                    return (
                      <View
                        key={`line-${lineIdx}`}
                        style={{
                          position: 'absolute',
                          left: `${x1Percent}%`,
                          top: `${y1}%`,
                          width: `${distance}%`,
                          height: 2,
                          backgroundColor: '#10b981',
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: 'left center',
                        }}
                      />
                    );
                  })}

                  {/* Draw dots */}
                  {card.monthlyData.map((value, dotIdx, arr) => {
                    const x = (dotIdx / (arr.length - 1)) * 97;
                    const y = 5 + ((gainerMaxValue - value) / gainerRange) * 90;

                    return (
                      <View
                        key={`dot-${dotIdx}`}
                        style={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: `${y}%`,
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: '#10b981',
                          marginLeft: -1.5,
                          marginTop: -1.5,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            </ThemedView>
          );
        })}
      </ThemedView>

      {/* Top Losers */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Top Losers
        </ThemedText>
        <ThemedText style={styles.subsectionSubtitle}>
          Cards with biggest price decreases (30d)
        </ThemedText>

        {/* Losers Charts */}
        {losers.map((card, idx) => {
          const loserMinValue = Math.min(...card.monthlyData);
          const loserMaxValue = Math.max(...card.monthlyData);
          const loserRange = loserMaxValue - loserMinValue;

          return (
            <ThemedView key={`loser-${idx}`} style={[styles.lineChartContainer, { borderColor: colors.tabIconDefault, marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                  <ThemedText type="defaultSemiBold">{card.name}</ThemedText>
                  <ThemedText style={styles.cardSubtext}>{card.set}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="defaultSemiBold" style={{ color: '#ef4444' }}>
                    {card.change}
                  </ThemedText>
                  <ThemedText style={[styles.cardSubtext, { color: '#ef4444' }]}>
                    {card.percentChange.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.lineChart, { height: 150 }]}>
                <View style={styles.chartArea}>
                  {/* Draw lines */}
                  {card.monthlyData.map((value, lineIdx, arr) => {
                    if (lineIdx === arr.length - 1) return null;

                    const x1Percent = (lineIdx / (arr.length - 1)) * 97;
                    const x2Percent = ((lineIdx + 1) / (arr.length - 1)) * 97;
                    const y1 = 5 + ((loserMaxValue - value) / loserRange) * 90;
                    const y2 = 5 + ((loserMaxValue - arr[lineIdx + 1]) / loserRange) * 90;

                    const dxPercent = x2Percent - x1Percent;
                    const dyPercent = y2 - y1;
                    const distance = Math.sqrt(dxPercent * dxPercent + dyPercent * dyPercent);
                    const angle = Math.atan2(dyPercent, dxPercent) * (180 / Math.PI);

                    return (
                      <View
                        key={`line-${lineIdx}`}
                        style={{
                          position: 'absolute',
                          left: `${x1Percent}%`,
                          top: `${y1}%`,
                          width: `${distance}%`,
                          height: 2,
                          backgroundColor: '#ef4444',
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: 'left center',
                        }}
                      />
                    );
                  })}

                  {/* Draw dots */}
                  {card.monthlyData.map((value, dotIdx, arr) => {
                    const x = (dotIdx / (arr.length - 1)) * 97;
                    const y = 5 + ((loserMaxValue - value) / loserRange) * 90;

                    return (
                      <View
                        key={`dot-${dotIdx}`}
                        style={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: `${y}%`,
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: '#ef4444',
                          marginLeft: -1.5,
                          marginTop: -1.5,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            </ThemedView>
          );
        })}
      </ThemedView>

      <View style={{ height: 24 }} />
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
