import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<User | null>;
  public user: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.user = this.userSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.userSubject.value;
  }

  // Let a user log in with their credentials
  login(username: string, password: string): Observable<User> {
    // Try to log in with the server
    return this.http.post<User>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(userData => {
          // Success! Save their info for later
          this.storeUserData(userData);
          return userData;
        }),
        catchError(err => this.fixErrorMsg(err))
      );
  }

  // Sign up a new user
  register(userInfo: Partial<User>): Observable<User> {
    // Send registration info to server
    return this.http.post<User>(`${this.apiUrl}/register`, userInfo)
      .pipe(
        tap(newUser => {
          // Got a new user back - save their token and details
          this.storeUserData(newUser);
          return newUser;
        }),
        catchError(err => this.fixErrorMsg(err))
      );
  }

  // Log the user out
  logout(): Observable<any> {
    // Tell the server we're logging out
    return this.http.post<any>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          // Clear user data locally
          this.clearSession();
        }),
        catchError(err => this.fixErrorMsg(err))
      );
  }
  
  // Helper to store user data consistently
  private storeUserData(user: User): void {
    // Save to local storage for page refreshes
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update our observable so components know
    this.userSubject.next(user);
  }
  
  // Clear all user data
  private clearUserData(): void {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  checkSession(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/session`)
      .pipe(
        tap(user => {
          // update stored user if returned from API
          if (user && this.currentUserValue?.token) {
            // maintain the token from storage
            user.token = this.currentUserValue.token;
            localStorage.setItem('user', JSON.stringify(user));
            this.userSubject.next(user);
          }
          return user;
        }),
        catchError(error => {
          if (error.status === 401) {
            // auto logout if 401 response returned from api
            this.clearSession();
          }
          return throwError(() => error);
        })
      );
  }

  clearSession(): void {
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  private getUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user', e);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  // Makes error messages more user-friendly
  private fixErrorMsg(err: any) {
    // Start with a default message
    let msg = 'Something went wrong with the server';
    
    // Check for different error types
    if (err.error instanceof ErrorEvent) {
      // Network/client-side error
      msg = `Network problem: ${err.error.message}`;
    } else if (err.error?.message) {
      // Got an error message from the server
      msg = err.error.message;
      
      // Add some specific handling for common errors
      if (msg.includes('credentials')) {
        msg = 'Wrong username or password. Please try again.';
      } else if (msg.includes('exist')) {
        msg = 'This username is already taken. Try another one.';
      }
    } else if (err.status === 401) {
      msg = 'You need to log in again';
    } else if (err.status === 403) {
      msg = 'You don\'t have permission to do that';
    } else if (err.status === 500) {
      msg = 'Server error - we\'re working on it!';
    }
    
    // Send the friendly error back
    return throwError(() => new Error(msg));
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user?.token;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return !!user?.token && user.role === 'admin';
  }
}