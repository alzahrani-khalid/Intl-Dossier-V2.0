import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Screens
import { IntakeScreen } from '../screens/intake/IntakeScreen';
import { GlobalSearchScreen } from '../screens/search/GlobalSearchScreen';
import { AssignmentsScreen } from '../screens/assignments/AssignmentsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRTL = i18n.language === 'ar';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* Front Door Tab */}
      <Tab.Screen
        name="FrontDoor"
        component={IntakeScreen}
        options={{
          title: t('navigation.front_door'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="door-open" size={size} color={color} />
          ),
        }}
      />

      {/* Search Tab */}
      <Tab.Screen
        name="Search"
        component={GlobalSearchScreen}
        options={{
          title: t('navigation.search'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />

      {/* T091: Assignments Tab */}
      <Tab.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{
          title: t('navigation.assignments'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-list"
              size={size}
              color={color}
            />
          ),
          tabBarBadge: undefined, // Can be set dynamically for pending assignments count
        }}
      />

      {/* Profile/Settings Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
