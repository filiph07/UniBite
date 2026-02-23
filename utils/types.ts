export type IngredientCategory = 'veg' | 'meat' | 'dairy' | 'grain' | 'snack' | 'other';

export interface InventoryItem {
  id: string;
  userId: string;
  ingredientName: string;
  addedAt: number;
  category: IngredientCategory;
}

export interface GeneratedRecipe {
  title: string;
  timeMinutes: number;
  ingredientsUsed: string[];
  steps: string[];
}

export interface SavedRecipe {
  id: string;
  userId: string;
  title: string;
  timeMinutes: number;
  ingredientsList: string[];
  instructions: string[];
  createdAt: number;
}


