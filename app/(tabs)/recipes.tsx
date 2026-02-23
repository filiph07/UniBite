import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { auth } from '@/services/firebase';
import { generateRecipeFromInventory } from '@/services/ai';
import { subscribeToInventory } from '@/services/inventory';
import {
  saveRecipeForUser,
  subscribeToSavedRecipes,
  deleteSavedRecipe,
} from '@/services/savedRecipes';
import type { GeneratedRecipe, InventoryItem, SavedRecipe } from '@/utils/types';

const PANTRY_STAPLES: string[] = [
  'salt',
  'pepper',
  'olive oil',
  'vegetable oil',
  'garlic powder',
  'onion powder',
  'dried herbs',
];

export default function RecipesScreen() {
  const user = auth.currentUser;
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setInventoryLoading(false);
      setSavedLoading(false);
      return;
    }

    const unsubscribeInventory = subscribeToInventory(
      user.uid,
      (items) => {
        setInventory(items);
        setInventoryLoading(false);
      },
      (err) => {
        setInventoryError(err.message);
        setInventoryLoading(false);
      },
    );

    const unsubscribeSaved = subscribeToSavedRecipes(
      user.uid,
      (items) => {
        setSavedRecipes(items);
        setSavedLoading(false);
      },
      (err) => {
        setSavedError(err.message);
        setSavedLoading(false);
      },
    );

    return () => {
      unsubscribeInventory();
      unsubscribeSaved();
    };
  }, [user?.uid]);

  const handleGenerate = async () => {
    if (!user?.uid) {
      Alert.alert('Not logged in', 'Please log in to generate recipes.');
      return;
    }

    if (inventory.length === 0) {
      Alert.alert(
        'No ingredients',
        'Add a few ingredients to your fridge first so UniBite can build a recipe.',
      );
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const nextRecipe = await generateRecipeFromInventory(inventory, PANTRY_STAPLES);
      setRecipe(nextRecipe);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate recipe.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !recipe) return;

    try {
      setSaving(true);
      await saveRecipeForUser(user.uid, recipe);
      Alert.alert('Saved', 'Recipe saved to your account.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await deleteSavedRecipe(id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete saved recipe.');
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Recipes</Text>
        <Text style={styles.subtitle}>Please log in to generate recipes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Recipe Generator</Text>
      <Text style={styles.subtitle}>
        UniBite will combine your fridge items with common pantry staples to suggest a meal.
      </Text>

      {inventoryLoading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : inventoryError ? (
        <Text style={styles.errorText}>{inventoryError}</Text>
      ) : (
        <Text style={styles.inventoryHint}>
          Using {inventory.length} ingredient{inventory.length === 1 ? '' : 's'} from your fridge.
        </Text>
      )}

      <Pressable
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={generating}
      >
        <Text style={styles.generateButtonText}>
          {generating ? 'Generating…' : 'Generate meal'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {recipe && (
        <ScrollView style={styles.recipeCard} contentContainerStyle={styles.recipeContent}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeMeta}>{recipe.timeMinutes} min</Text>
          </View>

          <Text style={styles.sectionTitle}>Ingredients used</Text>
          {recipe.ingredientsUsed.map((ing) => (
            <Text key={ing} style={styles.bulletText}>
              • {ing}
            </Text>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Steps</Text>
          {recipe.steps.map((step, index) => (
            <Text key={index} style={styles.bulletText}>
              {index + 1}. {step}
            </Text>
          ))}

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save recipe'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={styles.savedContainer}>
        <Text style={styles.savedTitle}>Saved recipes</Text>

        {savedLoading ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : savedError ? (
          <Text style={styles.errorText}>{savedError}</Text>
        ) : savedRecipes.length === 0 ? (
          <Text style={styles.savedEmpty}>
            You haven&apos;t saved any recipes yet. Generate one and tap &quot;Save recipe&quot;.
          </Text>
        ) : (
          <ScrollView style={styles.savedList} contentContainerStyle={styles.savedListContent}>
            {savedRecipes.map((r) => (
              <View key={r.id} style={styles.savedCard}>
                <View style={styles.savedCardMain}>
                  <Text style={styles.savedCardTitle}>{r.title}</Text>
                  <Text style={styles.savedCardMeta}>
                    {r.timeMinutes} min ·{' '}
                    {r.ingredientsList.slice(0, 2).join(', ')}
                    {r.ingredientsList.length > 2 ? ' +' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteSaved(r.id)}
                  style={styles.savedDeleteButton}
                >
                  <Text style={styles.savedDeleteText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
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
  inventoryHint: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 12,
  },
  errorText: {
    color: '#f97316',
    marginTop: 12,
    fontSize: 13,
  },
  generateButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#022c22',
    fontWeight: '600',
    fontSize: 16,
  },
  recipeCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  recipeContent: {
    padding: 16,
    paddingBottom: 24,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5e7eb',
    flex: 1,
    marginRight: 8,
  },
  recipeMeta: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 4,
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 2,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#e0f2fe',
    fontWeight: '600',
    fontSize: 15,
  },
  savedContainer: {
    marginTop: 16,
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  savedEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  savedList: {
    marginTop: 4,
  },
  savedListContent: {
    paddingBottom: 16,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 8,
  },
  savedCardMain: {
    flex: 1,
    marginRight: 8,
  },
  savedCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  savedCardMeta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  savedDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  savedDeleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
});

