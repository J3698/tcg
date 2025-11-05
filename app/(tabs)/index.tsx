import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScannedCard {
  id: string;
  name: string;
  set: string;
  cardNumber: string;
  imageUri: string;
  estimatedValue: number;
  condition: 'mint' | 'near-mint' | 'lightly-played' | 'moderately-played' | 'heavily-played';
  scanDate: string;
}

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedCard, setScannedCard] = useState<ScannedCard | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = Colors[colorScheme ?? 'light'];

  const handleDemoScan = async () => {
    // Use a sample Pokémon card image URL
    const demoImageUrl = 'https://images.pokemontcg.io/base1/4.png';
    setSelectedImage(demoImageUrl);
    simulateScan(demoImageUrl);
  };

  const simulateScan = async (imageUri: string) => {
    setLoading(true);
    // Simulate API call to card recognition service
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockCard: ScannedCard = {
      id: 'charizard-1-holo',
      name: 'Charizard',
      set: 'Base Set',
      cardNumber: '4/102',
      imageUri: imageUri,
      estimatedValue: 2500,
      condition: 'near-mint',
      scanDate: new Date().toLocaleDateString(),
    };

    setScannedCard(mockCard);
    setLoading(false);
  };

  const handleScan = async () => {
    await handleDemoScan();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Scan Card</ThemedText>
        <ThemedText style={styles.subtitle}>
          Take a photo or upload an image of a Pokémon card
        </ThemedText>
      </ThemedView>

      {!scannedCard && !loading && (
        <ThemedView style={styles.actionContainer}>
          <Pressable
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={handleScan}>
            <IconSymbol name="camera.fill" size={24} color="white" />
            <Text style={styles.buttonText}>Scan Card</Text>
          </Pressable>
        </ThemedView>
      )}

      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Scanning card...</ThemedText>
        </ThemedView>
      )}

      {scannedCard && (
        <ScrollView style={styles.resultContainer}>
          <ThemedView style={styles.cardPreview}>
            <Image
              source={{ uri: scannedCard.imageUri }}
              style={styles.cardImage}
              contentFit="contain"
            />
          </ThemedView>

          <ThemedView style={styles.cardDetailsContainer}>
            <ThemedView style={styles.headerRow}>
              <View>
                <ThemedText type="title" style={styles.cardName}>
                  {scannedCard.name}
                </ThemedText>
                <ThemedText style={styles.cardSet}>
                  {scannedCard.set} • #{scannedCard.cardNumber}
                </ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.statsGrid}>
              <ThemedView style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Est. Value</ThemedText>
                <ThemedText type="title" style={styles.statValue}>
                  ${(scannedCard.estimatedValue / 100).toFixed(2)}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Condition</ThemedText>
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.conditionBadge,
                    {
                      color: getConditionColor(scannedCard.condition),
                    },
                  ]}>
                  {scannedCard.condition
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Recent Sales (Last 10)</ThemedText>
              <ThemedView style={styles.salesList}>
                {[
                  { price: 2800, date: '2 days ago', condition: 'Mint' },
                  { price: 2450, date: '1 week ago', condition: 'Near Mint' },
                  { price: 1950, date: '10 days ago', condition: 'Lightly Played' },
                  { price: 2600, date: '2 weeks ago', condition: 'Mint' },
                  { price: 2200, date: '3 weeks ago', condition: 'Near Mint' },
                ].map((sale, idx) => (
                  <ThemedView key={idx} style={styles.saleItem}>
                    <View>
                      <ThemedText type="defaultSemiBold">${sale.price}</ThemedText>
                      <ThemedText style={styles.saleDetail}>{sale.condition}</ThemedText>
                    </View>
                    <ThemedText style={styles.saleDetail}>{sale.date}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>

            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.tint }]}
              onPress={() => {
                setScannedCard(null);
                setSelectedImage(null);
              }}>
              <Text style={[styles.buttonText, { color: colors.tint }]}>Scan Another Card</Text>
            </Pressable>
          </ThemedView>
        </ScrollView>
      )}
    </ScrollView>
  );
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case 'mint':
      return '#10B981';
    case 'near-mint':
      return '#3B82F6';
    case 'lightly-played':
      return '#F59E0B';
    case 'moderately-played':
      return '#EF4444';
    case 'heavily-played':
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
  actionContainer: {
    alignItems: 'stretch',
    gap: 12,
    marginVertical: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    borderWidth: 0,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultContainer: {
    flex: 1,
    marginTop: 16,
  },
  cardPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 40,
    marginBottom: 24,
  },
  cardImage: {
    width: 240,
    height: 320,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardDetailsContainer: {
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardSet: {
    opacity: 0.6,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
  },
  conditionBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  salesList: {
    gap: 8,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saleDetail: {
    fontSize: 13,
    opacity: 0.6,
  },
});
