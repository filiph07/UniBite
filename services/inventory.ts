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
import type { InventoryItem, IngredientCategory } from '@/utils/types';

const INVENTORY_COLLECTION = 'inventory';

export function subscribeToInventory(
  userId: string,
  onItems: (items: InventoryItem[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(
    collection(db, INVENTORY_COLLECTION),
    where('userId', '==', userId),
    orderBy('addedAt', 'desc'),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: InventoryItem[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<InventoryItem, 'id'>;
        return { id: d.id, ...data };
      });
      onItems(items);
    },
    (error) => {
      onError(error as Error);
    },
  );

  return unsubscribe;
}

export async function addInventoryItem(
  userId: string,
  ingredientName: string,
  category: IngredientCategory,
) {
  await addDoc(collection(db, INVENTORY_COLLECTION), {
    userId,
    ingredientName,
    category,
    addedAt: Date.now(),
  });
}

export async function deleteInventoryItem(id: string) {
  await deleteDoc(doc(db, INVENTORY_COLLECTION, id));
}

