import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login'); // <-- Add this line
    } catch (error: any) {
      Alert.alert('Error logging out', error?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {user ? (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Logged in as:</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>You are not logged in.</Text>
      )}

      {user && (
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#020617', // Matching your dark theme
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 32,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  email: {
    fontSize: 18,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: '#ef4444', // Red for logout
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});