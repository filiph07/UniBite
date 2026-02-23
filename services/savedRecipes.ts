import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import type { GeneratedRecipe, SavedRecipe } from '@/utils/types';

const SAVED_RECIPES_COLLECTION = 'savedRecipes';

export async function saveRecipeForUser(userId: string, recipe: GeneratedRecipe) {
  await addDoc(collection(db, SAVED_RECIPES_COLLECTION), {
    userId,
    title: recipe.title,
    timeMinutes: recipe.timeMinutes,
    ingredientsList: recipe.ingredientsUsed,
    instructions: recipe.steps,
    createdAt: Date.now(),
  });
}

export function subscribeToSavedRecipes(
  userId: string,
  onRecipes: (recipes: SavedRecipe[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(
    collection(db, SAVED_RECIPES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: SavedRecipe[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<SavedRecipe, 'id'>;
        return { id: d.id, ...data };
      });
      onRecipes(items);
    },
    (err) => onError(err as Error),
  );

  return unsubscribe;
}

export async function deleteSavedRecipe(id: string) {
  await deleteDoc(doc(db, SAVED_RECIPES_COLLECTION, id));
}

