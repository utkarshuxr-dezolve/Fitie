import { Redirect, Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { Home, Dumbbell, UtensilsCrossed, Activity, User } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useAuth } from '@/src/AuthContext';

function TabIcon({ icon: Icon, focused, label }: { icon: any; focused: boolean; label: string }) {
  return (
    <View style={styles.tabItem}>
      {focused ? (
        <View style={styles.activeWrap}>
          <Icon size={20} color={colors.textInverse} strokeWidth={2.5} />
        </View>
      ) : (
        <Icon size={22} color={colors.tabInactive} strokeWidth={1.8} />
      )}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} label="Home" />, tabBarTestID: 'home-tab' }} />
      <Tabs.Screen name="activity" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Dumbbell} focused={focused} label="Activity" />, tabBarTestID: 'activity-tab' }} />
      <Tabs.Screen name="nutrition" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={UtensilsCrossed} focused={focused} label="Nutrition" />, tabBarTestID: 'nutrition-tab' }} />
      <Tabs.Screen name="health" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Activity} focused={focused} label="Health" />, tabBarTestID: 'health-tab' }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} label="Profile" />, tabBarTestID: 'profile-tab' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBg,
    borderTopWidth: 0,
    height: 82,
    paddingTop: 8,
    paddingBottom: 18,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  activeWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 10, fontWeight: '600', color: colors.tabInactive, marginTop: 2 },
  tabLabelActive: { color: colors.primary },
});
