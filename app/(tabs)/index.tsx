import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [scannedCard, setScannedCard] = useState<ScannedCard | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = Colors[colorScheme ?? 'light'];

  const handleTakePicture = async () => {
    // Use a sample Pokémon card image URL (simulating camera)
    const demoImageUrl = 'https://images.pokemontcg.io/base1/4.png';
    simulateScan(demoImageUrl);
  };

  const handleUpload = async () => {
    // Use a different sample card for upload demo
    const demoImageUrl = 'https://images.pokemontcg.io/base1/2.png';
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

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Scanning card...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (scannedCard) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
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
            }}>
            <Text style={[styles.buttonText, { color: colors.tint }]}>Scan Another Card</Text>
          </Pressable>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, flex: 1, paddingTop: insets.top }]}>
      <ThemedView style={styles.cameraWindow}>
        <View style={styles.smallCornerIcon}>
          <View style={[styles.smallCorner, styles.smallTopLeft, { borderColor: colors.tint }]} />
          <View style={[styles.smallCorner, styles.smallTopRight, { borderColor: colors.tint }]} />
          <View style={[styles.smallCorner, styles.smallBottomLeft, { borderColor: colors.tint }]} />
          <View style={[styles.smallCorner, styles.smallBottomRight, { borderColor: colors.tint }]} />
        </View>
        <ThemedText style={styles.cameraText}>
          Ready to Scan
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.buttonsContainer, { paddingHorizontal: 16, paddingBottom: 24 }]}>
        <Pressable
          style={[styles.largeButton, { backgroundColor: colors.tint }]}
          onPress={handleTakePicture}>
          <View style={styles.tinyCornerIcon}>
            <View style={[styles.tinyCorner, styles.tinyTopLeft, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyTopRight, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyBottomLeft, { borderColor: 'white' }]} />
            <View style={[styles.tinyCorner, styles.tinyBottomRight, { borderColor: 'white' }]} />
          </View>
          <Text style={styles.largeButtonText}>Take Picture</Text>
        </Pressable>

        <Pressable
          style={[styles.largeButton, { borderColor: colors.tint, borderWidth: 1, backgroundColor: 'transparent' }]}
          onPress={handleUpload}>
          <IconSymbol name="arrow.up" size={14} color={colors.tint} />
          <Text style={[styles.largeButtonText, { color: colors.tint }]}>Upload Image</Text>
        </Pressable>
      </ThemedView>
    </ThemedView>
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
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  cameraWindow: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    opacity: 0.5,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cornerIcon: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  smallCornerIcon: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  smallCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  smallTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopLeftRadius: 4,
  },
  smallTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopRightRadius: 4,
  },
  smallBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 4,
  },
  smallBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomRightRadius: 4,
  },
  tinyCornerIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  tinyCorner: {
    position: 'absolute',
    width: 6,
    height: 6,
  },
  tinyTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 2,
  },
  tinyTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderTopRightRadius: 2,
  },
  tinyBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderBottomLeftRadius: 2,
  },
  tinyBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomLeftRadius: 2,
  },
  buttonCornerIcon: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  buttonCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  buttonTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopLeftRadius: 4,
  },
  buttonTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopRightRadius: 4,
  },
  buttonBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 4,
  },
  buttonBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomRightRadius: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  largeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  saleDetail: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
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
