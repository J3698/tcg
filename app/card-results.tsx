import React from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CardResultsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse the card data from params
  const cardData = params.data ? JSON.parse(params.data as string) : null;

  if (!cardData) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText>No card data available</ThemedText>
      </ThemedView>
    );
  }

  const { imageUri, psa_card, listings, statistics } = cardData;

  // Sort listings by date (most recent first) and take only the first 10
  const sortedListings = [...listings]
    .sort((a: any, b: any) => new Date(b.sell_date).getTime() - new Date(a.sell_date).getTime())
    .slice(0, 10);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.cardPreview}>
        <Image
          source={{ uri: imageUri }}
          style={styles.cardImage}
          contentFit="contain"
        />
      </ThemedView>

      <ThemedView style={styles.cardDetailsContainer}>
        <ThemedView style={styles.headerRow}>
          <View>
            <ThemedText type="title" style={styles.cardName}>
              {psa_card.subject}
            </ThemedText>
            <ThemedText style={styles.cardSet}>
              {psa_card.brand} • {psa_card.year}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.statsGrid}>
          <ThemedView style={styles.statBox}>
            <ThemedText style={styles.statLabel}>Est. Value</ThemedText>
            <ThemedText type="title" style={styles.statValue}>
              {listings.length > 0 ? `$${statistics.average_price.toFixed(2)}` : '-'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.statBox}>
            <ThemedText style={styles.statLabel}>Condition</ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={[styles.conditionBadge, { color: colors.tint }]}>
              {psa_card.grade}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Sales</ThemedText>
          {listings.length > 0 ? (
            <ThemedView style={styles.salesList}>
              {sortedListings.map((sale: any, idx: number) => (
                <ThemedView key={idx} style={styles.saleItem}>
                  <Image
                    source={{ uri: sale.image }}
                    style={styles.saleImage}
                    contentFit="cover"
                  />
                  <View style={styles.saleInfo}>
                    <View>
                      <ThemedText type="defaultSemiBold">${sale.sell_price.toFixed(2)}</ThemedText>
                      <ThemedText style={styles.saleDetail}>
                        {sale.auth_guarantee ? 'Authenticated' : ''}
                        {sale.psa_vault ? ' • PSA Vault' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.saleDetail}>
                      {new Date(sale.sell_date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}
            </ThemedView>
          ) : (
            <ThemedText style={styles.noSalesText}>No Recent Sales</ThemedText>
          )}
        </ThemedView>

        <Pressable
          style={[styles.button, styles.secondaryButton, { borderColor: colors.tint }]}
          onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: colors.tint }]}>Scan Another Card</Text>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  cardPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    paddingVertical: 40,
    marginBottom: 24,
  },
  cardImage: {
    width: 240,
    height: 320,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDetailsContainer: {
    gap: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardSet: {
    opacity: 0.5,
    fontSize: 13,
    fontWeight: '400',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#e5e5e5',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  conditionBadge: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  salesList: {
    gap: 0,
  },
  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 12,
  },
  saleImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  saleInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleDetail: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
  },
  noSalesText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.5,
    textAlign: 'center',
    paddingVertical: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
