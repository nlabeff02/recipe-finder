import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'recipes/search',
    canActivate: [authGuard],
    loadComponent: () => import('./components/recipes/recipe-search/recipe-search.component').then(m => m.RecipeSearchComponent)
  },
  {
    path: 'recipes/saved',
    canActivate: [authGuard],
    loadComponent: () => import('./components/recipes/saved-recipes/saved-recipes.component').then(m => m.SavedRecipesComponent)
  },
  {
    path: 'recipes/saved/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/recipes/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'meal-plans',
    canActivate: [authGuard],
    loadComponent: () => import('./components/meal-plans/meal-plan-list/meal-plan-list.component').then(m => m.MealPlanListComponent)
  },
  {
    path: 'meal-plans/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/meal-plans/meal-plan-detail/meal-plan-detail.component').then(m => m.MealPlanDetailComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/users/:id',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/admin/user-edit/user-edit.component').then(m => m.UserEditComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
