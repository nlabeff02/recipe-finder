import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { RecipeService } from '../../../services/recipe.service';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  loading = true;
  error = '';
  isFromSearch = false;

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Recipe ID is missing';
        this.loading = false;
        return;
      }

      // Check if this is from search or from saved recipes
      this.isFromSearch = this.router.getCurrentNavigation()?.extras.state?.['fromSearch'] === true;

      this.loadRecipeDetails(id);
    });
  }

  loadRecipeDetails(id: string): void {
    this.loading = true;
    this.error = '';
    
    this.recipeService.getSavedRecipeById(id)
      .subscribe({
        next: (recipe) => {
          this.recipe = recipe;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Could not load recipe details';
          this.loading = false;
        }
      });
  }

  saveRecipe(): void {
    if (!this.recipe) return;
    
    this.recipeService.saveRecipe(this.recipe)
      .subscribe({
        next: () => {
          this.toastr.success('Recipe saved to your collection', 'Success');
          this.isFromSearch = false;
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

  deleteRecipe(): void {
    if (!this.recipe || !this.recipe._id) return;
    
    if (confirm('Are you sure you want to remove this recipe from your saved recipes?')) {
      this.recipeService.deleteSavedRecipe(this.recipe._id)
        .subscribe({
          next: () => {
            this.toastr.success('Recipe removed from your collection', 'Success');
            this.router.navigate(['/recipes/saved']);
          },
          error: (error) => {
            this.toastr.error('Could not remove recipe', 'Error');
          }
        });
    }
  }

  addToMealPlan(): void {
    // Redirect to meal plans page
    this.router.navigate(['/meal-plans']);
    this.toastr.info('Go to a meal plan and add this recipe to your weekly schedule', 'Meal Planning');
  }
}