import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { Home, Dumbbell, UtensilsCrossed, Heart, User } from 'lucide-react-native';
import { colors, spacing } from '@/src/theme';

function TabIcon({ icon: Icon, focused, label }: { icon: any; focused: boolean; label: string }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Icon size={22} color={focused ? colors.primary : '#9CA3AF'} strokeWidth={2} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} label="Home" />,
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Dumbbell} focused={focused} label="Activity" />,
          tabBarTestID: 'activity-tab',
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={UtensilsCrossed} focused={focused} label="Nutrition" />,
          tabBarTestID: 'nutrition-tab',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Heart} focused={focused} label="Health" />,
          tabBarTestID: 'health-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} label="Profile" />,
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EBF3ED',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
