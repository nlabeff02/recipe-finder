import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { RecipeService } from '../../../services/recipe.service';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-saved-recipes',
  templateUrl: './saved-recipes.component.html',
  styleUrls: ['./saved-recipes.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class SavedRecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = true;
  error = '';
  filterTerm = '';
  filteredRecipes: Recipe[] = [];
  sortBy = 'savedAt';
  sortDirection = 'desc';

  constructor(
    private recipeService: RecipeService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadSavedRecipes();
  }

  loadSavedRecipes(): void {
    this.loading = true;
    this.recipeService.getSavedRecipes()
      .subscribe({
        next: (recipes) => {
          this.recipes = recipes;
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Could not load saved recipes';
          this.loading = false;
        }
      });
  }

  deleteRecipe(recipeId: string): void {
    if (confirm('Are you sure you want to remove this recipe from your saved recipes?')) {
      this.recipeService.deleteSavedRecipe(recipeId)
        .subscribe({
          next: () => {
            this.recipes = this.recipes.filter(recipe => recipe._id !== recipeId);
            this.applyFiltersAndSort();
            this.toastr.success('Recipe removed from your collection', 'Success');
          },
          error: (error) => {
            this.toastr.error('Could not remove recipe', 'Error');
          }
        });
    }
  }

  applyFilter(event: Event): void {
    this.filterTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFiltersAndSort();
  }

  applySorting(sortOption: string): void {
    if (this.sortBy === sortOption) {
      // Toggle direction if same sort option
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortOption;
      this.sortDirection = 'desc'; // Default to descending for new sort option
    }
    
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    // Apply filter
    this.filteredRecipes = this.filterTerm 
      ? this.recipes.filter(recipe => 
          recipe.title.toLowerCase().includes(this.filterTerm) ||
          recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(this.filterTerm))
        )
      : [...this.recipes];
    
    // Apply sorting
    this.filteredRecipes.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'calories':
          comparison = (a.calories || 0) - (b.calories || 0);
          break;
        case 'time':
          comparison = (a.totalTime || 0) - (b.totalTime || 0);
          break;
        case 'savedAt':
        default:
          const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }
}