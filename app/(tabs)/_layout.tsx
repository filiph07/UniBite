import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Active tab color (Emerald 500)
        tabBarActiveTintColor: '#10b981', 
        // Inactive tab color (Slate 500)
        tabBarInactiveTintColor: '#64748b', 
        tabBarStyle: {
          backgroundColor: '#020617', // Match your dark background
          borderTopColor: '#1e293b',  // Subtle border
          paddingBottom: 5,           // Slight padding for aesthetics
        },
        headerStyle: {
          backgroundColor: '#020617', // Match header to background
        },
        headerTintColor: '#e5e7eb',   // Light gray header text
        headerShadowVisible: false,   // Removes the harsh header line
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="fridge-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chef-hat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* If you have any old default Expo files like two.tsx, we hide them from the tab bar like this: */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}