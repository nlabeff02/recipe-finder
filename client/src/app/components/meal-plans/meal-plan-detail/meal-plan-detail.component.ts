import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { MealPlanService } from '../../../services/meal-plan.service';
import { RecipeService } from '../../../services/recipe.service';
import { MealPlan } from '../../../models/meal-plan.model';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-meal-plan-detail',
  templateUrl: './meal-plan-detail.component.html',
  styleUrls: ['./meal-plan-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class MealPlanDetailComponent implements OnInit {
  mealPlan: MealPlan | null = null;
  savedRecipes: Recipe[] = [];
  loading = true;
  recipesLoading = true;
  error = '';
  selectedDay: number = -1;
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | '' = '';
  showRecipeSelector = false;
  searchTerm = '';
  filteredRecipes: Recipe[] = [];

  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Get the meal plan ID from the URL
    this.route.paramMap.subscribe(routeParams => {
      // Extract the ID parameter
      const planId = routeParams.get('id');
      
      // Make sure we actually got an ID
      if (!planId) {
        this.error = 'Hmm, can\'t find that meal plan - no ID in the URL';
        this.loading = false;
        return;
      }

      // Load the plan and recipes we need
      this.fetchMealPlan(planId);
      this.fetchMyRecipes();
    });
  }

  // Get the meal plan details from the server
  fetchMealPlan(planId: string): void {
    // Show spinner
    this.loading = true;
    
    // Try to get the meal plan
    this.mealPlanService.getMealPlanById(planId)
      .subscribe({
        next: (plan) => {
          // Store the plan data
          this.mealPlan = plan;
          
          // Hide spinner
          this.loading = false;
        },
        error: (oops) => {
          // Show appropriate error
          if (oops.status === 404) {
            this.error = 'Couldn\'t find that meal plan. It might have been deleted.';
          } else {
            this.error = oops.message || 'Trouble connecting to the server. Try again?';
          }
          
          // Hide spinner
          this.loading = false;
        }
      });
  }

  // Load the user's saved recipes for selecting meals
  fetchMyRecipes(): void {
    // Show spinner for recipes
    this.recipesLoading = true;
    
    // Get all the user's saved recipes
    this.recipeService.getSavedRecipes()
      .subscribe({
        next: (recipes) => {
          // Store the recipes
          this.savedRecipes = recipes;
          
          // Start with all recipes visible in the picker
          this.filteredRecipes = [...recipes];
          
          // Hide recipe spinner
          this.recipesLoading = false;
        },
        error: (oops) => {
          // Let the user know something went wrong
          this.toastr.error(
            'Couldn\'t load your saved recipes. Try refreshing the page?', 
            'Connection Problem'
          );
          
          // Hide spinner
          this.recipesLoading = false;
        }
      });
  }

  // Show recipe picker when user wants to add a meal
  openRecipeSelector(dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner'): void {
    // Remember which day and meal we're picking for
    this.selectedDay = dayIndex;
    this.selectedMealType = mealType;
    
    // Reset search box when opening
    this.searchTerm = '';
    
    // Show all available recipes initially
    this.filteredRecipes = [...this.savedRecipes];
    
    // Display the recipe selector modal
    this.showRecipeSelector = true;
  }

  // Hide the recipe picker
  closeRecipeSelector(): void {
    // Hide the modal
    this.showRecipeSelector = false;
    
    // Reset selection state
    this.selectedDay = -1;
    this.selectedMealType = '';
    
    // Clear search term too
    this.searchTerm = '';
  }

  // User picked a recipe for their meal plan
  selectRecipe(recipeId: string): void {
    // Make sure we have everything we need
    if (!this.mealPlan || this.selectedDay === -1 || !this.selectedMealType) {
      return; // Can't proceed without these
    }
    
    // Save the recipe to the selected day & meal type
    this.mealPlan.days[this.selectedDay][this.selectedMealType] = recipeId;
    
    // Save to the database
    this.saveMealPlanChanges('Recipe added to meal plan!');
  }

  // User wants to remove a recipe from their plan
  removeRecipe(dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner'): void {
    // Make sure we have a meal plan loaded
    if (!this.mealPlan) {
      return;
    }
    
    // Clear this meal slot
    this.mealPlan.days[dayIndex][mealType] = '';
    
    // Save the updated plan
    this.saveMealPlanChanges('Recipe removed from your plan');
  }
  
  // Helper function to save changes
  private saveMealPlanChanges(successMsg: string): void {
    // Make sure we have a meal plan with an ID
    if (!this.mealPlan?._id) {
      this.toastr.error('Can\'t save changes - no meal plan loaded');
      return;
    }
    
    // Send the updated plan to the server
    this.mealPlanService.updateMealPlan(this.mealPlan._id, this.mealPlan)
      .subscribe({
        next: (updated) => {
          // Update our local copy with the server version
          this.mealPlan = updated;
          
          // Show success message
          this.toastr.success(successMsg, 'Saved!');
          
          // Close the recipe picker if it's open
          if (this.showRecipeSelector) {
            this.closeRecipeSelector();
          }
        },
        error: (oops) => {
          // Show error to the user
          this.toastr.error(
            'Something went wrong saving your meal plan. Try again?', 
            'Save Failed'
          );
          
          console.log('Error updating meal plan:', oops);
        }
      });
  }

  // Filter recipes when user types in search box
  searchRecipes(event: Event): void {
    // Get what the user typed and convert to lowercase
    const searchBox = event.target as HTMLInputElement;
    this.searchTerm = searchBox.value.toLowerCase();
    
    if (this.searchTerm) {
      // Filter recipes that match the search term
      this.filteredRecipes = this.savedRecipes.filter(recipe => {
        const title = recipe.title.toLowerCase();
        
        // Check if recipe title contains search term
        return title.includes(this.searchTerm);
      });
    } else {
      // No search term = show all recipes
      this.filteredRecipes = [...this.savedRecipes];
    }
  }

  // Look up a recipe from our saved recipes
  getRecipeById(recipeId: string): Recipe | undefined {
    // Try to find a recipe that matches either ID format
    const foundRecipe = this.savedRecipes.find(recipe => {
      return recipe._id === recipeId || recipe.recipeId === recipeId;
    });
    
    return foundRecipe;
  }

  // Make the date look pretty for display
  formatDate(date: Date | null): string {
    // Handle empty dates
    if (!date) return 'No date selected';
    
    // Create date object
    const dateObj = new Date(date);
    
    // Configure how we want the date displayed
    const dateFormat: Intl.DateTimeFormatOptions = { 
      weekday: 'long',     // Monday, Tuesday, etc.
      month: 'long',       // January, February, etc.
      day: 'numeric',      // 1, 2, 3, etc.
      year: 'numeric'      // 2023, 2024, etc.
    };
    
    // Format and return the date
    return dateObj.toLocaleDateString('en-US', dateFormat);
  }
}