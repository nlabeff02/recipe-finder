import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule]
})
export class UserEditComponent implements OnInit {
  user: User | null = null;
  userForm!: FormGroup;
  loading = true;
  submitting = false;
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
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'User ID is missing';
        this.loading = false;
        return;
      }

      this.loadUser(id);
    });
  }

  initForm(): void {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      active: [true],
      password: [''], // Optional for updates
      preferences: this.formBuilder.group({
        dietaryPreferences: [[]],
        allergies: [[]]
      })
    });
  }

  loadUser(id: string): void {
    this.loading = true;
    
    this.userService.getUserById(id)
      .subscribe({
        next: (user) => {
          this.user = user;
          this.populateForm(user);
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Could not load user details';
          this.loading = false;
        }
      });
  }

  populateForm(user: User): void {
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      preferences: {
        dietaryPreferences: user.preferences?.dietaryPreferences || [],
        allergies: user.preferences?.allergies || []
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.user) {
      return;
    }
    
    this.submitting = true;
    
    // Only include password if it was provided
    const formValue = this.userForm.value;
    if (!formValue.password) {
      delete formValue.password;
    }
    
    this.userService.updateUser(this.user._id, formValue)
      .subscribe({
        next: (updatedUser) => {
          this.toastr.success(`User ${updatedUser.username} updated successfully`, 'Success');
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          this.error = error.message || 'Could not update user';
          this.submitting = false;
        }
      });
  }

  togglePreference(list: string, item: string): void {
    const formArray = (this.userForm.get('preferences') as FormGroup).get(list) as any;
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
    const values = (this.userForm.get('preferences') as FormGroup).get(list)?.value as string[];
    return values ? values.includes(item) : false;
  }
}