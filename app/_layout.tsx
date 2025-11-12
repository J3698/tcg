import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already signed in
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Sign in anonymously if no session exists
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) {
            console.error('Error signing in anonymously:', error);
          } else {
            console.log('Signed in anonymously:', data);
          }
        } else {
          console.log('Already signed in');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initAuth();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
