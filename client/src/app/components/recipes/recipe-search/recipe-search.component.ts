import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

import { RecipeService, RecipeSearchParams, RecipeSearchResponse } from '../../../services/recipe.service';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-recipe-search',
  templateUrl: './recipe-search.component.html',
  styleUrls: ['./recipe-search.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RecipeSearchComponent implements OnInit {
  searchForm!: FormGroup;
  recipes: Recipe[] = [];
  loading = false;
  searched = false;
  error = '';
  nextPage: string | null = null;
  currentPage = 0;
  
  // Options for form filter selects
  dietOptions = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'high-protein', label: 'High Protein' },
    { value: 'high-fiber', label: 'High Fiber' },
    { value: 'low-fat', label: 'Low Fat' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'low-sodium', label: 'Low Sodium' }
  ];

  healthOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'peanut-free', label: 'Peanut-Free' },
    { value: 'tree-nut-free', label: 'Tree Nut-Free' },
    { value: 'soy-free', label: 'Soy-Free' },
    { value: 'shellfish-free', label: 'Shellfish-Free' },
    { value: 'fish-free', label: 'Fish-Free' },
    { value: 'egg-free', label: 'Egg-Free' }
  ];

  mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'teatime', label: 'Teatime' }
  ];

  cuisineTypeOptions = [
    { value: 'american', label: 'American' },
    { value: 'asian', label: 'Asian' },
    { value: 'british', label: 'British' },
    { value: 'caribbean', label: 'Caribbean' },
    { value: 'central europe', label: 'Central European' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'french', label: 'French' },
    { value: 'indian', label: 'Indian' },
    { value: 'italian', label: 'Italian' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'middle eastern', label: 'Middle Eastern' },
    { value: 'south american', label: 'South American' },
    { value: 'south east asian', label: 'South East Asian' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private recipeService: RecipeService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Set up the form when component loads
    this.setupSearchForm();
  }

  // Creates our search form with empty values
  setupSearchForm(): void {
    // Group all the form controls together
    this.searchForm = this.formBuilder.group({
      query: [''],              // What the user types to search
      diet: [[]],               // Diet preferences like low-carb
      health: [[]],             // Health restrictions like gluten-free
      mealType: [[]],           // When to eat it - breakfast, lunch, etc
      cuisineType: [[]]         // What style of food - Mexican, Italian, etc
    });
  }

  // User clicked the search button
  onSubmit(): void {
    // Show spinner
    this.loading = true;
    
    // Reset any previous errors
    this.error = '';
    
    // Keep track that we've done a search
    this.searched = true;
    
    // Start from the beginning
    this.currentPage = 0;
    this.nextPage = null;
    
    // Grab all the filters from the form
    const params = this.getSearchParams();
    
    // Go find some recipes!
    this.recipeService.searchRecipes(params)
      .subscribe({
        next: (results) => {
          // Got some recipes back
          this.processSearchResults(results);
          this.loading = false;
        },
        error: (err) => {
          // Something went wrong :(
          this.error = err.message || 'Oops! Something went wrong with your search.';
          this.loading = false;
        }
      });
  }

  loadMore(): void {
    if (!this.nextPage || this.loading) return;
    
    this.loading = true;
    this.currentPage++;
    
    const searchParams = this.getSearchParams();
    searchParams.page = this.currentPage;
    
    // Extract _cont parameter from next link
    if (this.nextPage) {
      const url = new URL(this.nextPage);
      const cont = url.searchParams.get('_cont');
      if (cont) searchParams._cont = cont;
    }
    
    this.recipeService.searchRecipes(searchParams)
      .subscribe({
        next: (response) => {
          // Append new recipes to existing ones
          this.recipes = [...this.recipes, ...response.recipes];
          
          // Update next page link
          this.nextPage = response._links?.next ? response._links.next.href : null;
          
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Error loading more recipes';
          this.loading = false;
        }
      });
  }

  // Extract values from the form and format them for the API
  private getSearchParams(): RecipeSearchParams {
    // Grab what the user entered
    const formStuff = this.searchForm.value;
    
    // Start with empty params
    const searchStuff: RecipeSearchParams = {};
    
    // Only add values that are actually filled in
    if (formStuff.query) {
      // Trim whitespace from search text
      searchStuff.query = formStuff.query.trim();
    }
    
    // Only add filters if there's something selected
    if (formStuff.diet?.length) searchStuff.diet = formStuff.diet;
    if (formStuff.health?.length) searchStuff.health = formStuff.health;
    if (formStuff.mealType?.length) searchStuff.mealType = formStuff.mealType;
    if (formStuff.cuisineType?.length) searchStuff.cuisineType = formStuff.cuisineType;
    
    return searchStuff;
  }

  // Handle the API response
  private processSearchResults(response: RecipeSearchResponse): void {
    // Store recipes
    this.recipes = response.recipes;
    
    // Do we have more pages?
    this.nextPage = response._links?.next ? response._links.next.href : null;
    
    // Let the user know if we didn't find anything
    if (this.recipes.length === 0 && this.searched) {
      this.toastr.info('No tasty recipes found! Try different keywords or filters.', 'No Results');
    }
  }

  saveRecipe(recipe: Recipe): void {
    this.recipeService.saveRecipe(recipe)
      .subscribe({
        next: () => {
          this.toastr.success('Recipe saved to your collection', 'Success');
        },
        error: (error) => {
          if (error.status === 400 && error.error.message === 'Recipe already saved') {
            this.toastr.info('This recipe is already in your collection', 'Already Saved');
          } else {
            this.toastr.error('Could not save recipe', 'Error');
          }
        }
      });
  }

  // Add or remove filter when user clicks a checkbox
  toggleFilterOption(filterType: string, option: any): void {
    // Get what's already selected
    const selected = this.searchForm.get(filterType)?.value as any[] || [];
    
    // Check if this option is already picked
    const idx = selected.indexOf(option.value);
    
    if (idx === -1) {
      // Not found - let's add it
      const updatedChoices = [...selected, option.value];
      this.searchForm.get(filterType)?.setValue(updatedChoices);
    } else {
      // Already there - remove it
      const updatedChoices = [...selected]; // make a copy
      updatedChoices.splice(idx, 1);        // remove the item
      this.searchForm.get(filterType)?.setValue(updatedChoices);
    }
  }

  // Check if a filter option is currently selected
  isOptionSelected(filterType: string, option: any): boolean {
    // Grab the currently selected values for this filter type
    const chosen = this.searchForm.get(filterType)?.value as any[] || [];
    
    // Is our option in the list?
    return chosen.includes(option.value);
  }
}