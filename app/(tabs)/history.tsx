import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface HistoryCard {
  id: string;
  name: string;
  set: string;
  cardNumber: string;
  imageUri?: string;
  estimatedValue: number;
  lastScanned: string;
  condition: string;
  recentSales: Sale[];
}

interface Sale {
  price: number;
  date: string;
  condition: string;
  sellerRating?: number;
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedCard, setSelectedCard] = useState<HistoryCard | null>(null);

  const mockHistory: HistoryCard[] = [
    {
      id: 'charizard-1-holo',
      name: 'Charizard',
      set: 'Base Set',
      cardNumber: '4/102',
      imageUri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
      estimatedValue: 2500,
      lastScanned: '2 hours ago',
      condition: 'Near Mint',
      recentSales: [
        { price: 2800, date: '2 days ago', condition: 'Mint', sellerRating: 99 },
        { price: 2450, date: '1 week ago', condition: 'Near Mint', sellerRating: 98 },
        { price: 1950, date: '10 days ago', condition: 'Lightly Played', sellerRating: 97 },
        { price: 2600, date: '2 weeks ago', condition: 'Mint', sellerRating: 99 },
        { price: 2200, date: '3 weeks ago', condition: 'Near Mint', sellerRating: 98 },
        { price: 2350, date: '1 month ago', condition: 'Near Mint', sellerRating: 99 },
        { price: 2100, date: '1 month ago', condition: 'Lightly Played', sellerRating: 96 },
        { price: 2900, date: '5 weeks ago', condition: 'Mint', sellerRating: 99 },
        { price: 2150, date: '6 weeks ago', condition: 'Near Mint', sellerRating: 98 },
        { price: 2050, date: '2 months ago', condition: 'Lightly Played', sellerRating: 97 },
      ],
    },
    {
      id: 'blastoise-1-holo',
      name: 'Blastoise',
      set: 'Base Set',
      cardNumber: '2/102',
      estimatedValue: 1800,
      lastScanned: '1 day ago',
      condition: 'Lightly Played',
      recentSales: [
        { price: 1950, date: '3 days ago', condition: 'Near Mint', sellerRating: 98 },
        { price: 1650, date: '1 week ago', condition: 'Lightly Played', sellerRating: 97 },
        { price: 1750, date: '2 weeks ago', condition: 'Lightly Played', sellerRating: 98 },
        { price: 2000, date: '3 weeks ago', condition: 'Near Mint', sellerRating: 99 },
        { price: 1700, date: '4 weeks ago', condition: 'Lightly Played', sellerRating: 96 },
        { price: 1850, date: '5 weeks ago', condition: 'Near Mint', sellerRating: 98 },
        { price: 1600, date: '6 weeks ago', condition: 'Moderately Played', sellerRating: 95 },
        { price: 1900, date: '7 weeks ago', condition: 'Lightly Played', sellerRating: 97 },
        { price: 1550, date: '2 months ago', condition: 'Moderately Played', sellerRating: 94 },
        { price: 1800, date: '2.5 months ago', condition: 'Lightly Played', sellerRating: 96 },
      ],
    },
    {
      id: 'venusaur-1-holo',
      name: 'Venusaur',
      set: 'Base Set',
      cardNumber: '3/102',
      estimatedValue: 1650,
      lastScanned: '3 days ago',
      condition: 'Moderately Played',
      recentSales: [
        { price: 1800, date: '1 week ago', condition: 'Lightly Played', sellerRating: 98 },
        { price: 1500, date: '2 weeks ago', condition: 'Moderately Played', sellerRating: 96 },
        { price: 1700, date: '3 weeks ago', condition: 'Lightly Played', sellerRating: 97 },
        { price: 1550, date: '1 month ago', condition: 'Moderately Played', sellerRating: 95 },
        { price: 1650, date: '5 weeks ago', condition: 'Moderately Played', sellerRating: 96 },
        { price: 1400, date: '6 weeks ago', condition: 'Heavily Played', sellerRating: 93 },
        { price: 1750, date: '7 weeks ago', condition: 'Lightly Played', sellerRating: 98 },
        { price: 1600, date: '2 months ago', condition: 'Moderately Played', sellerRating: 95 },
        { price: 1350, date: '2.5 months ago', condition: 'Heavily Played', sellerRating: 92 },
        { price: 1700, date: '3 months ago', condition: 'Lightly Played', sellerRating: 97 },
      ],
    },
  ];

  const renderCardItem = (card: HistoryCard) => (
    <Pressable
      key={card.id}
      onPress={() => setSelectedCard(card)}
      style={[styles.historyCard, { borderColor: colors.tabIconDefault }]}>
      <View style={styles.cardItemContent}>
        <View>
          <ThemedText type="defaultSemiBold" style={styles.itemCardName}>
            {card.name}
          </ThemedText>
          <ThemedText style={styles.itemCardSet}>
            {card.set} • #{card.cardNumber}
          </ThemedText>
          <ThemedText style={styles.itemCardScanned}>{card.lastScanned}</ThemedText>
        </View>
        <View style={styles.cardItemRight}>
          <ThemedText type="title" style={styles.itemPrice}>
            ${(card.estimatedValue / 100).toFixed(2)}
          </ThemedText>
          <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
        </View>
      </View>
    </Pressable>
  );

  if (selectedCard) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Pressable
          onPress={() => setSelectedCard(null)}
          style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>Back</ThemedText>
        </Pressable>

        <ThemedView style={styles.detailHeader}>
          <ThemedText type="title">{selectedCard.name}</ThemedText>
          <ThemedText style={styles.detailSet}>
            {selectedCard.set} • #{selectedCard.cardNumber}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsSection}>
          <ThemedView style={[styles.statBox, { borderColor: colors.tabIconDefault }]}>
            <ThemedText style={styles.statLabel}>Est. Value</ThemedText>
            <ThemedText type="title">${(selectedCard.estimatedValue / 100).toFixed(2)}</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statBox, { borderColor: colors.tabIconDefault }]}>
            <ThemedText style={styles.statLabel}>Last Scanned</ThemedText>
            <ThemedText type="defaultSemiBold">{selectedCard.lastScanned}</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statBox, { borderColor: colors.tabIconDefault }]}>
            <ThemedText style={styles.statLabel}>Condition</ThemedText>
            <ThemedText type="defaultSemiBold">{selectedCard.condition}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.salesSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Last 10 eBay Sales
          </ThemedText>

          <View style={styles.priceChart}>
            <View style={styles.chartBar}>
              {selectedCard.recentSales.map((sale, idx) => {
                const maxPrice = Math.max(...selectedCard.recentSales.map(s => s.price));
                const barHeight = (sale.price / maxPrice) * 100;
                const conditionColor = getConditionColor(sale.condition);

                return (
                  <View
                    key={idx}
                    style={[
                      styles.chartColumn,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: conditionColor,
                      },
                    ]}
                    title={`$${sale.price} - ${sale.date}`}
                  />
                );
              })}
            </View>
          </View>

          <ThemedView style={styles.salesTable}>
            {selectedCard.recentSales.map((sale, idx) => (
              <ThemedView key={idx} style={[styles.saleRow, { borderBottomColor: colors.tabIconDefault }]}>
                <View style={styles.saleLeftContent}>
                  <ThemedText type="defaultSemiBold">${sale.price}</ThemedText>
                  <ThemedText style={[styles.saleSubtext, { color: getConditionColor(sale.condition) }]}>
                    {sale.condition}
                  </ThemedText>
                </View>
                <View style={styles.saleRightContent}>
                  {sale.sellerRating && (
                    <ThemedText style={styles.saleSubtext}>
                      ★ {sale.sellerRating}%
                    </ThemedText>
                  )}
                  <ThemedText style={styles.saleSubtext}>{sale.date}</ThemedText>
                </View>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Scan History</ThemedText>
        <ThemedText style={styles.subtitle}>
          {mockHistory.length} cards scanned
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.historyList}>
        {mockHistory.map(card => renderCardItem(card))}
      </ThemedView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case 'Mint':
      return '#10B981';
    case 'Near Mint':
      return '#3B82F6';
    case 'Lightly Played':
      return '#F59E0B';
    case 'Moderately Played':
      return '#EF4444';
    case 'Heavily Played':
      return '#7C3AED';
    default:
      return '#6B7280';
  }
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
    marginTop: 8,
    opacity: 0.6,
    fontSize: 14,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  cardItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCardName: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemCardSet: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  itemCardScanned: {
    fontSize: 11,
    opacity: 0.5,
  },
  cardItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemPrice: {
    fontSize: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailHeader: {
    marginVertical: 20,
    gap: 4,
  },
  detailSet: {
    opacity: 0.6,
    fontSize: 14,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  salesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  priceChart: {
    marginBottom: 20,
    height: 120,
  },
  chartBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  chartColumn: {
    flex: 1,
    borderRadius: 4,
    minHeight: 4,
  },
  salesTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  saleLeftContent: {
    gap: 4,
  },
  saleRightContent: {
    alignItems: 'flex-end',
    gap: 2,
  },
  saleSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
});
