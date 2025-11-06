import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];

  const handleOpenLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Account
        </ThemedText>
        <ThemedView style={[styles.settingItem, { borderBottomColor: colors.tabIconDefault }]}>
          <ThemedText>App Version</ThemedText>
          <ThemedText style={styles.settingValue}>1.0.0</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Contact & Legal
        </ThemedText>

        <Pressable
          style={[styles.linkItem, { borderBottomColor: colors.tabIconDefault }]}
          onPress={() => handleOpenLink('mailto:support@tcgvaluer.com')}>
          <View style={styles.linkContent}>
            <ThemedText>Contact Us</ThemedText>
            <ThemedText style={styles.linkEmail}>support@tcgvaluer.com</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
        </Pressable>

        <Pressable
          style={[styles.linkItem, { borderBottomColor: colors.tabIconDefault }]}
          onPress={() => handleOpenLink('https://tcgvaluer.com/terms')}>
          <View style={styles.linkContent}>
            <ThemedText>Terms of Service</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
        </Pressable>

        <Pressable
          style={[styles.linkItem, { borderBottomColor: colors.tabIconDefault }]}
          onPress={() => handleOpenLink('https://tcgvaluer.com/privacy')}>
          <View style={styles.linkContent}>
            <ThemedText>Privacy Policy</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
        </Pressable>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  settingValue: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: '400',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  linkContent: {
    gap: 4,
  },
  linkEmail: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '400',
  },
});
