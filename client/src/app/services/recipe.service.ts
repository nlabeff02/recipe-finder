import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Recipe } from '../models/recipe.model';
import { environment } from '../../environments/environment';

export interface RecipeSearchParams {
  query?: string;
  diet?: string | string[];
  health?: string | string[];
  mealType?: string | string[];
  cuisineType?: string | string[];
  page?: number;
  limit?: number;
  _cont?: string;
}

export interface RecipeSearchResponse {
  recipes: Recipe[];
  _links: {
    next?: {
      href: string;
      title: string;
    }
  };
  count: number;
  from: number;
  to: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = `${environment.apiUrl}/recipes`;

  constructor(private http: HttpClient) { }

  // Find recipes via Edamam API
  searchRecipes(searchParams: RecipeSearchParams): Observable<RecipeSearchResponse> {
    // Start with empty params
    let params = new HttpParams();
    
    // Add text search if provided
    if (searchParams.query) {
      params = params.append('query', searchParams.query);
    }
    
    // Handle diet filters
    this.addParamsFromArray(params, searchParams.diet, 'diet');
    
    // Process health restrictions
    this.addParamsFromArray(params, searchParams.health, 'health');
    
    // Deal with meal types
    this.addParamsFromArray(params, searchParams.mealType, 'mealType');
    
    // Add cuisine preferences
    this.addParamsFromArray(params, searchParams.cuisineType, 'cuisineType');
    
    // Pagination stuff
    if (searchParams.page !== undefined) {
      params = params.append('page', searchParams.page.toString());
    }
    
    if (searchParams.limit !== undefined) {
      params = params.append('limit', searchParams.limit.toString());
    }
    
    // For API pagination continuation token
    if (searchParams._cont) {
      params = params.append('_cont', searchParams._cont);
    }
    
    // Go get the recipes!
    return this.http.get<RecipeSearchResponse>(`${this.apiUrl}/search`, { params });
  }
  
  // Helper to avoid repeating the same array handling logic
  private addParamsFromArray(params: HttpParams, value: string | string[] | undefined, paramName: string): HttpParams {
    if (!value) return params;
    
    let updatedParams = params;
    
    // If it's an array, add each item separately
    if (Array.isArray(value)) {
      value.forEach(item => {
        updatedParams = updatedParams.append(paramName, item);
      });
    } else {
      // Single value
      updatedParams = updatedParams.append(paramName, value);
    }
    
    return updatedParams;
  }

  // Get user's saved recipes
  getSavedRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.apiUrl}/saved`);
  }

  // Get a specific saved recipe
  getSavedRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/saved/${id}`);
  }

  // Save a recipe
  saveRecipe(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.apiUrl}/saved`, recipe);
  }

  // Delete a saved recipe
  deleteSavedRecipe(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/saved/${id}`);
  }
}