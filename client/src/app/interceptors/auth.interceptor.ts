import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // get the current user
  const currentUser = authService.currentUserValue;
  const isLoggedIn = currentUser && currentUser.token;
  
  // if logged in, add token to request header
  if (isLoggedIn) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser!.token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // auto logout if 401 response returned from api
        authService.clearSession();
      }
      return throwError(() => error);
    })
  );
};