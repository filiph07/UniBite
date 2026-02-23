import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/services/firebase';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    try {
      setLoading(true);
      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Set their username
      await updateProfile(userCredential.user, { displayName: username });
      
      // 3. Send the verification email
      await sendEmailVerification(userCredential.user);

      Alert.alert(
        'Verify Your Email', 
        'Account created! We have sent a verification link to your email. Please verify it before logging in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Signup Error', error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-slate-950 px-6 justify-center">
      <Text className="text-4xl font-extrabold text-emerald-500 mb-2">Join UniBite.</Text>
      <Text className="text-slate-400 mb-8">Create an account to save your recipes.</Text>

      <TextInput
        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-slate-200 mb-4"
        placeholder="Username"
        placeholderTextColor="#64748b"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-slate-200 mb-4"
        placeholder="University Email"
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
        onPress={handleSignup} 
        disabled={loading}
      >
        <Text className="text-emerald-950 font-bold text-lg">{loading ? 'Creating...' : 'Create Account'}</Text>
      </Pressable>

      <Pressable className="mt-6 items-center" onPress={() => router.replace('/(auth)/login')}>
        <Text className="text-slate-400">Already have an account? <Text className="text-emerald-500 font-bold">Log in</Text></Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}