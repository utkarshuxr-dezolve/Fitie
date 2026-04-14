import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const check = async () => {
      const done = await AsyncStorage.getItem('onboarding_complete');
      setOnboardingComplete(done === 'true');
      setOnboardingChecked(true);
    };
    check();
  }, []);

  if (loading || !onboardingChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Auth has resolved — now route based on user + onboarding
  if (!onboardingComplete) {
    return <Redirect href={user ? "/onboarding" : "/(auth)/login"} />;
  }

  return <Redirect href={user ? "/(tabs)" : "/(auth)/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
