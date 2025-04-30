export interface MealPlan {
  _id?: string;
  userId?: string;
  weekStartDate: Date;
  days: MealPlanDay[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MealPlanDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}