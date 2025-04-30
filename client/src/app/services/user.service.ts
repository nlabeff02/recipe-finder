import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface PaginatedUsers {
  users: User[];
  page: number;
  pages: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Our API endpoint for user operations
  private userAPI = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  // Fetch users with optional pagination and filtering
  getUsers(page: number = 1, pageSize: number = 10, searchQuery: string = ''): Observable<PaginatedUsers> {
    // Start building the query params
    let queryParams = new HttpParams()
      // Which page of results we want
      .set('page', page.toString())
      // How many users per page
      .set('limit', pageSize.toString());
    
    // Add search filter if the admin typed something
    if (searchQuery && searchQuery.trim() !== '') {
      queryParams = queryParams.set('search', searchQuery.trim());
    }
    
    // Fire off the request to our backend
    return this.http.get<PaginatedUsers>(this.userAPI, { 
      params: queryParams 
    });
  }

  // Look up a specific user by their ID
  getUserById(userId: string): Observable<User> {
    // Simple GET request with the ID in the URL
    return this.http.get<User>(`${this.userAPI}/${userId}`);
  }

  // Make changes to a user's profile/settings
  updateUser(userId: string, changes: Partial<User>): Observable<User> {
    // Send only the fields that need to be updated
    return this.http.put<User>(`${this.userAPI}/${userId}`, changes);
  }

  // Deactivate a user account (we don't hard-delete users)
  deleteUser(userId: string): Observable<any> {
    // This actually performs a soft-delete on the server
    return this.http.delete<{message: string}>(`${this.userAPI}/${userId}`);
  }
}