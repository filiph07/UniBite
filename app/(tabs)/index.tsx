import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { auth } from '@/services/firebase';

export default function HomeScreen() {
  const user = auth.currentUser;
  
  // Create a friendly display name from the email (e.g., "john" from "john@email.com")
  const displayName = user?.email?.split('@')[0] || 'Chef';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{displayName}! 🍳</Text>
      </View>

      <Text style={styles.subtitle}>What would you like to do today?</Text>

      <View style={styles.cardContainer}>
        {/* Quick link to the Fridge tab */}
        <Pressable 
          style={[styles.card, styles.fridgeCard]} 
          onPress={() => router.push('/(tabs)/fridge')}
        >
          <Text style={styles.cardIcon}>❄️</Text>
          <Text style={styles.cardTitle}>My Fridge</Text>
          <Text style={styles.cardDesc}>Add or remove ingredients</Text>
        </Pressable>

        {/* Quick link to the Recipes tab */}
        <Pressable 
          style={[styles.card, styles.recipeCard]} 
          onPress={() => router.push('/(tabs)/recipes')}
        >
          <Text style={styles.cardIcon}>✨</Text>
          <Text style={styles.cardTitle}>AI Recipes</Text>
          <Text style={styles.cardDesc}>Find something to cook</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#020617', // Matches your dark theme
  },
  header: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 18,
    color: '#9ca3af',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 16,
    fontWeight: '500',
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  fridgeCard: {
    backgroundColor: '#064e3b', // Subtle dark emerald
    borderColor: '#047857',
  },
  recipeCard: {
    backgroundColor: '#1e3a8a', // Subtle dark blue
    borderColor: '#1d4ed8',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
  },
});