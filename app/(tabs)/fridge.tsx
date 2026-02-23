import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
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
      <View style={styles.centered}>
        <Text style={styles.title}>Fridge</Text>
        <Text style={styles.subtitle}>Please log in to manage your fridge.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your fridge</Text>
        <Text style={styles.subtitle}>Add what you currently have at home.</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chicken breast"
          value={ingredientName}
          onChangeText={setIngredientName}
        />
      </View>

      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.value}
            style={[
              styles.categoryChip,
              category === c.value && styles.categoryChipActive,
            ]}
            onPress={() => setCategory(c.value)}
          >
            <Text
              style={[
                styles.categoryText,
                category === c.value && styles.categoryTextActive,
              ]}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.addButton} onPress={handleAdd} disabled={adding}>
        <Text style={styles.addButtonText}>{adding ? 'Adding…' : 'Add to fridge'}</Text>
      </Pressable>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>
            Nothing in your fridge yet. Start by adding a few ingredients.
          </Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.ingredientName}</Text>
                  <Text style={styles.itemMeta}>{item.category}</Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#020617',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#020617',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e5e7eb',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  categoryChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryTextActive: {
    color: '#022c22',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#022c22',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorText: {
    color: '#f97316',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  itemName: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '500',
  },
  itemMeta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});

