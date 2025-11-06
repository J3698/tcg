import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function FourCornerIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 16, height: 16, position: 'relative' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 4, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color }} />
        <View style={{ position: 'absolute', top: 0, right: 0, width: 4, height: 4, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: color }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 4, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: color }} />
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 4, height: 4, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color }} />
      </View>
    </View>
  );
}

function ChartTrendIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 22, height: 22, position: 'relative' }}>
        {/* Baseline */}
        <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, height: 0.5, backgroundColor: color }} />
        {/* Chart bars */}
        <View style={{ position: 'absolute', bottom: 2, left: 1, width: 1.5, height: 5, backgroundColor: color }} />
        <View style={{ position: 'absolute', bottom: 2, left: 7, width: 1.5, height: 9, backgroundColor: color }} />
        <View style={{ position: 'absolute', bottom: 2, left: 13, width: 1.5, height: 13, backgroundColor: color }} />
        {/* Uptrend arrow */}
        <View style={{ position: 'absolute', top: 0, right: 1, width: 0, height: 0, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderBottomWidth: 3.5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color }} />
      </View>
    </View>
  );
}

function DotsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 16, height: 16, position: 'relative', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 }}>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <FourCornerIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <ChartTrendIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <DotsIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
