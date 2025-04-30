export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  preferences?: {
    dietaryPreferences: string[];
    allergies: string[];
  };
  active?: boolean;
  createdAt?: Date;
  token?: string;
}