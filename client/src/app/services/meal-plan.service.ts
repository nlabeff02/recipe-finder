import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MealPlan } from '../models/meal-plan.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MealPlanService {
  private apiUrl = `${environment.apiUrl}/meal-plans`;

  constructor(private http: HttpClient) { }

  // Get all meal plans for current user
  getMealPlans(): Observable<MealPlan[]> {
    return this.http.get<MealPlan[]>(this.apiUrl);
  }

  // Get a specific meal plan by ID
  getMealPlanById(id: string): Observable<MealPlan> {
    return this.http.get<MealPlan>(`${this.apiUrl}/${id}`);
  }

  // Create a new meal plan
  createMealPlan(mealPlan: Partial<MealPlan>): Observable<MealPlan> {
    return this.http.post<MealPlan>(this.apiUrl, mealPlan);
  }

  // Update an existing meal plan
  updateMealPlan(id: string, mealPlan: Partial<MealPlan>): Observable<MealPlan> {
    return this.http.put<MealPlan>(`${this.apiUrl}/${id}`, mealPlan);
  }

  // Delete a meal plan
  deleteMealPlan(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Helper method to create a new empty meal plan
  createEmptyMealPlan(startDate: Date): Partial<MealPlan> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    
    return {
      weekStartDate: startDate,
      days: days.map(day => ({
        day: day,
        breakfast: '',
        lunch: '',
        dinner: ''
      }))
    };
  }

  // Helper method to get Monday of the current week
  getCurrentWeekStartDate(): Date {
    const today = new Date();
    const day = today.getDay(); // Sunday - Saturday : 0 - 6
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(today.setDate(diff));
  }
}