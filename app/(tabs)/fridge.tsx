import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth } from '@/services/firebase';
import {
  addInventoryItem,
  deleteInventoryItem,
  subscribeToInventory,
} from '@/services/inventory';
import type { IngredientCategory, InventoryItem } from '@/utils/types';

const CATEGORIES: { label: string; value: IngredientCategory }[] = [
  { label: 'Veg', value: 'veg' },
  { label: 'Meat', value: 'meat' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Grain', value: 'grain' },
  { label: 'Snack', value: 'snack' },
  { label: 'Other', value: 'other' },
];

export default function FridgeScreen() {
  const user = auth.currentUser;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ingredientName, setIngredientName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('other');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToInventory(
      user.uid,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  const handleAdd = async () => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in again to manage your fridge.');
      return;
    }

    if (!ingredientName.trim()) {
      Alert.alert('Missing name', 'Please enter an ingredient name.');
      return;
    }

    try {
      setAdding(true);
      await addInventoryItem(user.uid, ingredientName.trim(), category);
      setIngredientName('');
      setCategory('other');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add ingredient.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete ingredient.');
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-slate-950">
        <Text className="text-2xl font-bold text-slate-200">Fridge</Text>
        <Text className="text-sm text-slate-400 mt-2 text-center">Please log in to manage your fridge.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950 px-4 pt-4 pb-2"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="mb-4">
        <Text className="text-3xl font-extrabold text-slate-200">Your Fridge</Text>
        <Text className="text-sm text-slate-400 mt-1">Add what you currently have at home.</Text>
      </View>

      {/* Input Field */}
      <View className="flex-row items-center mt-2">
        <TextInput
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-base shadow-sm"
          placeholder="e.g. Chicken breast, Spinach..."
          placeholderTextColor="#64748b"
          value={ingredientName}
          onChangeText={setIngredientName}
        />
      </View>

      {/* Category Pills */}
      <View className="flex-row flex-wrap gap-2 mt-4">
        {CATEGORIES.map((c) => {
          const isActive = category === c.value;
          return (
            <Pressable
              key={c.value}
              className={`px-4 py-2 rounded-full border ${
                isActive 
                  ? 'bg-emerald-500 border-emerald-500 shadow-sm' 
                  : 'bg-transparent border-slate-700'
              }`}
              onPress={() => setCategory(c.value)}
            >
              <Text
                className={`text-xs ${
                  isActive ? 'text-emerald-950 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Add Button */}
      <Pressable 
        className={`bg-emerald-500 rounded-xl py-3.5 items-center mt-6 shadow-sm ${adding ? 'opacity-70' : 'active:opacity-80'}`}
        onPress={handleAdd} 
        disabled={adding}
      >
        <Text className="text-emerald-950 font-bold text-base">
          {adding ? 'Adding...' : '➕ Add to fridge'}
        </Text>
      </Pressable>

      {/* Inventory List */}
      <View className="flex-1 mt-6">
        <Text className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2">Current Inventory</Text>
        
        {loading ? (
          <ActivityIndicator className="mt-4" color="#10b981" />
        ) : error ? (
          <Text className="text-rose-500 text-sm mt-2">{error}</Text>
        ) : items.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 items-center mt-2">
            <Text className="text-slate-500 text-center text-sm">Nothing in your fridge yet. Start by adding a few ingredients above!</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-slate-800/60">
                <View>
                  <Text className="text-slate-200 text-base font-semibold">{item.ingredientName}</Text>
                  <Text className="text-slate-500 text-xs mt-1 capitalize">{item.category}</Text>
                </View>
                <Pressable
                  className="px-3 py-1.5 rounded-full border border-rose-500/50 active:bg-rose-500/10"
                  onPress={() => handleDelete(item.id)}
                >
                  <Text className="text-rose-500 text-xs font-bold">Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}