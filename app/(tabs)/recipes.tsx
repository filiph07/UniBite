import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
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
        'Empty Fridge',
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
      Alert.alert('Success!', 'Recipe saved to your account.');
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
      <View className="flex-1 items-center justify-center px-6 bg-slate-950">
        <Text className="text-2xl font-bold text-slate-200">Recipes</Text>
        <Text className="text-sm text-slate-400 mt-2 text-center">Please log in to generate recipes.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 pt-4 pb-2 bg-slate-950">
      <Text className="text-3xl font-extrabold text-slate-200">AI Chef</Text>
      <Text className="text-sm text-slate-400 mt-1">
        UniBite will combine your fridge items with pantry staples to suggest a meal.
      </Text>

      {inventoryLoading ? (
        <ActivityIndicator className="mt-4" color="#10b981" />
      ) : inventoryError ? (
        <Text className="text-rose-500 mt-3 text-sm">{inventoryError}</Text>
      ) : (
        <Text className="text-xs text-slate-500 mt-3 font-medium uppercase tracking-wider">
          Using {inventory.length} ingredient{inventory.length === 1 ? '' : 's'} from your fridge
        </Text>
      )}

      {/* Main Generate Button */}
      <Pressable
        className={`bg-emerald-500 rounded-2xl py-4 items-center mt-4 shadow-lg ${generating ? 'opacity-50' : 'active:opacity-80'}`}
        onPress={handleGenerate}
        disabled={generating}
      >
        <Text className="text-emerald-950 font-bold text-lg">
          {generating ? 'Chopping virtual onions...' : "What's for dinner?"}
        </Text>
      </Pressable>

      {error && <Text className="text-rose-500 mt-3 text-sm text-center">{error}</Text>}

      {/* Generated Recipe Card */}
      {recipe && (
        <ScrollView className="mt-6 rounded-2xl bg-slate-900 border border-slate-800" contentContainerStyle={{ padding: 20 }}>
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-2xl font-bold text-slate-200 flex-1 mr-4">{recipe.title}</Text>
            <View className="bg-slate-800 px-3 py-1 rounded-full">
              <Text className="text-xs text-emerald-400 font-semibold">🕒 {recipe.timeMinutes} min</Text>
            </View>
          </View>

          <Text className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 mt-2">Ingredients Used</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {recipe.ingredientsUsed.map((ing) => (
              <View key={ing} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Text className="text-xs text-slate-300 capitalize">{ing}</Text>
              </View>
            ))}
          </View>

          <Text className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 mt-2">Instructions</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} className="flex-row mb-3 pr-4">
              <Text className="text-slate-500 font-bold mr-3">{index + 1}.</Text>
              <Text className="text-sm text-slate-300 leading-relaxed">{step}</Text>
            </View>
          ))}

          <Pressable
            className={`mt-4 border-2 border-emerald-500 rounded-xl py-3 items-center ${saving ? 'opacity-50' : 'active:bg-emerald-500/10'}`}
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="text-emerald-500 font-bold text-base">
              {saving ? 'Saving...' : '💾 Save this recipe'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Saved Recipes Section */}
      <View className="mt-8 flex-1">
        <Text className="text-lg font-bold text-slate-200 mb-2">Saved Recipes</Text>

        {savedLoading ? (
          <ActivityIndicator className="mt-2" color="#10b981" />
        ) : savedError ? (
          <Text className="text-rose-500 text-sm">{savedError}</Text>
        ) : savedRecipes.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 items-center mt-2">
            <Text className="text-slate-500 text-center text-sm">No saved recipes yet. Generate a meal and tap save!</Text>
          </View>
        ) : (
          <ScrollView className="mt-2" contentContainerStyle={{ paddingBottom: 20 }}>
            {savedRecipes.map((r) => (
              <View key={r.id} className="flex-row items-center justify-between py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-slate-200" numberOfLines={1}>{r.title}</Text>
                  <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>
                    {r.timeMinutes} min • {r.ingredientsList.slice(0, 3).join(', ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteSaved(r.id)}
                  className="bg-rose-500/10 px-3 py-2 rounded-lg"
                >
                  <Text className="text-xs font-bold text-rose-500">Delete</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}