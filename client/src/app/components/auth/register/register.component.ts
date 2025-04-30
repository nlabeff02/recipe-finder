import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  dietaryPreferences: string[] = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Low-Fat',
    'Low-Sodium'
  ];

  allergies: string[] = [
    'Peanuts',
    'Tree Nuts',
    'Dairy',
    'Eggs',
    'Wheat',
    'Soy',
    'Fish',
    'Shellfish'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // redirect to home if already logged in
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      preferences: this.formBuilder.group({
        dietaryPreferences: [[]],
        allergies: [[]]
      })
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
  }

  // custom validator to check that two fields match
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // return if another validator has already found an error on the matchingControl
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  // convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // create user object
    const user = {
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      preferences: this.f['preferences'].value
    };

    this.authService.register(user)
      .pipe(first())
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: error => {
          this.error = error;
          this.loading = false;
        }
      });
  }

  togglePreference(list: string, item: string): void {
    const formArray = (this.registerForm.get('preferences') as FormGroup).get(list) as any;
    const currentValues = formArray.value as string[];
    
    if (currentValues.includes(item)) {
      // Remove item
      formArray.setValue(currentValues.filter(i => i !== item));
    } else {
      // Add item
      formArray.setValue([...currentValues, item]);
    }
  }

  isSelected(list: string, item: string): boolean {
    const values = (this.registerForm.get('preferences') as FormGroup).get(list)?.value as string[];
    return values ? values.includes(item) : false;
  }
}