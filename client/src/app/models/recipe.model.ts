export interface Recipe {
  _id?: string;
  userId?: string;
  recipeId: string;
  title: string;
  image?: string;
  source?: string;
  sourceUrl?: string;
  ingredients: string[];
  calories?: number;
  totalTime?: number;
  dietLabels?: string[];
  healthLabels?: string[];
  nutrients?: {
    protein?: number;
    fat?: number;
    carbs?: number;
    [key: string]: number | undefined;
  };
  savedAt?: Date;
}