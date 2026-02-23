import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if the email is verified!
      if (!userCredential.user.emailVerified) {
        // If not verified, sign them right back out and warn them
        await signOut(auth);
        Alert.alert('Email Not Verified', 'Please check your inbox and verify your email before logging in.');
        return;
      }

      // If verified, go to the main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Error', error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-slate-950 px-6 justify-center">
      <Text className="text-4xl font-extrabold text-emerald-500 mb-2">Welcome Back.</Text>
      <Text className="text-slate-400 mb-8">Log in to see what's in your fridge.</Text>

      <TextInput
        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-slate-200 mb-4"
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-slate-200 mb-8"
        placeholder="Password"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable 
        className={`bg-emerald-500 rounded-xl py-4 items-center ${loading ? 'opacity-70' : 'active:opacity-80'}`}
        onPress={handleLogin} 
        disabled={loading}
      >
        <Text className="text-emerald-950 font-bold text-lg">{loading ? 'Logging in...' : 'Log In'}</Text>
      </Pressable>

      <Pressable className="mt-6 items-center" onPress={() => router.replace('/(auth)/signup')}>
        <Text className="text-slate-400">Don't have an account? <Text className="text-emerald-500 font-bold">Sign up</Text></Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}