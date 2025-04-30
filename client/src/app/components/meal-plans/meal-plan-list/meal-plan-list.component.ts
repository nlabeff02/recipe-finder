import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { MealPlanService } from '../../../services/meal-plan.service';
import { RecipeService } from '../../../services/recipe.service';
import { MealPlan } from '../../../models/meal-plan.model';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-meal-plan-list',
  templateUrl: './meal-plan-list.component.html',
  styleUrls: ['./meal-plan-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class MealPlanListComponent implements OnInit {
  mealPlans: MealPlan[] = [];
  selectedMealPlan: MealPlan | null = null;
  currentMealPlanIndex = 0;
  savedRecipes: Recipe[] = [];
  loading = true;
  error = '';
  newPlanStartDate: string = '';

  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Set default date to Monday of current week
    const monday = this.mealPlanService.getCurrentWeekStartDate();
    this.newPlanStartDate = monday.toISOString().split('T')[0];
    
    this.loadMealPlans();
    this.loadSavedRecipes();
  }

  loadMealPlans(): void {
    this.loading = true;
    
    this.mealPlanService.getMealPlans()
      .subscribe({
        next: (mealPlans) => {
          this.mealPlans = mealPlans;
          if (mealPlans.length > 0) {
            this.selectedMealPlan = mealPlans[0];
            this.currentMealPlanIndex = 0;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Could not load meal plans';
          this.loading = false;
        }
      });
  }

  loadSavedRecipes(): void {
    this.recipeService.getSavedRecipes()
      .subscribe({
        next: (recipes) => {
          this.savedRecipes = recipes;
        },
        error: (error) => {
          console.error('Error loading saved recipes:', error);
        }
      });
  }

  createNewMealPlan(): void {
    if (!this.newPlanStartDate) {
      this.toastr.error('Please select a start date for the meal plan', 'Error');
      return;
    }
    
    const startDate = new Date(this.newPlanStartDate);
    const newMealPlan = this.mealPlanService.createEmptyMealPlan(startDate);
    
    this.mealPlanService.createMealPlan(newMealPlan)
      .subscribe({
        next: (mealPlan) => {
          this.mealPlans.unshift(mealPlan);
          this.selectedMealPlan = mealPlan;
          this.currentMealPlanIndex = 0;
          this.toastr.success('New meal plan created successfully', 'Success');
          
          // Reset the form
          const monday = this.mealPlanService.getCurrentWeekStartDate();
          this.newPlanStartDate = monday.toISOString().split('T')[0];
        },
        error: (error) => {
          if (error.status === 400 && error.error.message === 'A meal plan for this week already exists') {
            this.toastr.error('A meal plan for this week already exists', 'Error');
          } else {
            this.toastr.error('Could not create meal plan', 'Error');
          }
        }
      });
  }

  deleteMealPlan(mealPlanId: string): void {
    if (confirm('Are you sure you want to delete this meal plan?')) {
      this.mealPlanService.deleteMealPlan(mealPlanId)
        .subscribe({
          next: () => {
            this.mealPlans = this.mealPlans.filter(plan => plan._id !== mealPlanId);
            
            if (this.selectedMealPlan?._id === mealPlanId) {
              this.currentMealPlanIndex = 0;
              this.selectedMealPlan = this.mealPlans.length > 0 ? this.mealPlans[0] : null;
            }
            
            this.toastr.success('Meal plan deleted successfully', 'Success');
          },
          error: (error) => {
            this.toastr.error('Could not delete meal plan', 'Error');
          }
        });
    }
  }

  selectMealPlan(mealPlan: MealPlan): void {
    this.selectedMealPlan = mealPlan;
    this.currentMealPlanIndex = this.mealPlans.findIndex(p => p._id === mealPlan._id);
  }

  selectPreviousMealPlan(): void {
    if (this.currentMealPlanIndex < this.mealPlans.length - 1) {
      this.currentMealPlanIndex++;
      this.selectedMealPlan = this.mealPlans[this.currentMealPlanIndex];
    }
  }

  selectNextMealPlan(): void {
    if (this.currentMealPlanIndex > 0) {
      this.currentMealPlanIndex--;
      this.selectedMealPlan = this.mealPlans[this.currentMealPlanIndex];
    }
  }

  getRecipeName(recipeId: string | undefined): string {
    if (!recipeId) return '';
    const recipe = this.savedRecipes.find(r => r._id === recipeId || r.recipeId === recipeId);
    return recipe ? recipe.title : 'Unknown Recipe';
  }

  countMeals(mealPlan: MealPlan): number {
    if (!mealPlan || !mealPlan.days) return 0;
    
    return mealPlan.days.reduce((count, day) => {
      return count + 
        (day.breakfast ? 1 : 0) + 
        (day.lunch ? 1 : 0) + 
        (day.dinner ? 1 : 0);
    }, 0);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    
    const d = new Date(date);
    const endDate = new Date(d);
    endDate.setDate(d.getDate() + 6); // Add 6 days to get the end of the week
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${d.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }
}