import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { UserService, PaginatedUsers } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class AdminDashboardComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  pageSize = 20;
  
  // Filtering
  searchTerm = '';
  searchInput = '';
  filteredUsers: User[] = [];
  
  // Sorting
  sortBy = 'username';
  sortDirection = 'asc';

  constructor(
    private userService: UserService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  // Get users from the server
  loadUsers(page: number = 1): void {
    // Show the loading spinner
    this.loading = true;
    
    // Ask for the requested page of users
    this.userService.getUsers(page, this.pageSize)
      .subscribe({
        next: (userData: PaginatedUsers) => {
          // Got them! Save the user list
          this.users = userData.users;
          
          // Make a copy for filtering
          this.filteredUsers = [...this.users];
          
          // Update pagination info
          this.currentPage = userData.page;
          this.totalPages = userData.pages;
          this.totalUsers = userData.total;
          
          // Apply any active filters
          this.applyFilters();
          
          // Hide the spinner
          this.loading = false;
        },
        error: (oops) => {
          // Uh oh - something went wrong
          this.error = oops.message || 'Server error while loading users';
          
          // Hide the spinner
          this.loading = false;
        }
      });
  }

  // Jump to a specific page
  goToPage(pageNum: number): void {
    // Make sure it's a valid page
    if (pageNum < 1 || pageNum > this.totalPages) return;
    
    // Update our page tracker
    this.currentPage = pageNum;
    
    // Load the right page (with or without search)
    if (this.searchTerm) {
      this.loadUsersWithSearch();
    } else {
      this.loadUsers(pageNum);
    }
  }

  // Enable/disable a user account
  toggleUserStatus(user: User): void {
    // Figure out what we're doing
    const newStatus = !user.active;
    const actionWord = newStatus ? 'activate' : 'deactivate';
    
    // Ask for confirmation
    if (confirm(`Are you sure you want to ${actionWord} ${user.username}'s account?`)) {
      // Send the update to the server
      this.userService.updateUser(user._id, { active: newStatus })
        .subscribe({
          next: (updated) => {
            // Find this user in our local list
            const userIdx = this.users.findIndex(u => u._id === user._id);
            
            // Update the local copy if found
            if (userIdx !== -1) {
              this.users[userIdx] = updated;
              this.applyFilters();
            }
            
            // Let the admin know it worked
            this.toastr.success(
              `${updated.username}'s account ${actionWord}d!`, 
              'Account Updated'
            );
          },
          error: (err) => {
            // Something went wrong
            this.toastr.error(
              `Couldn't ${actionWord} this account. Try again later.`, 
              'Update Failed'
            );
          }
        });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to disable user ${user.username}? This action cannot be undone.`)) {
      this.userService.deleteUser(user._id)
        .subscribe({
          next: () => {
            // Update user status in the list
            const index = this.users.findIndex(u => u._id === user._id);
            if (index !== -1) {
              this.users[index].active = false;
              this.applyFilters();
            }
            
            this.toastr.success(`User ${user.username} disabled successfully`, 'Success');
          },
          error: (error) => {
            this.toastr.error('Failed to disable user', 'Error');
          }
        });
    }
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    this.searchTerm = this.searchInput.toLowerCase();
    this.currentPage = 1; // Reset to first page
    this.loadUsersWithSearch();
  }

  // Load users with search filtering applied
  loadUsersWithSearch(): void {
    // Show the loading spinner
    this.loading = true;
    
    // Call the server with our search term
    this.userService.getUsers(
      this.currentPage,    // Current page number
      this.pageSize,       // How many per page
      this.searchTerm      // What we're searching for
    ).subscribe({
        next: (results: PaginatedUsers) => {
          // Got our filtered results!
          this.users = results.users;
          
          // Copy for local filtering/sorting
          this.filteredUsers = [...this.users];
          
          // Update pagination data
          this.currentPage = results.page;
          this.totalPages = results.pages;
          this.totalUsers = results.total;
          
          // Apply current sort to results
          this.sortUsers();
          
          // Hide spinner
          this.loading = false;
        },
        error: (oops) => {
          // Show error message
          this.error = oops.message || 'Server error while searching users';
          
          // Hide spinner
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    // Local sorting only
    this.filteredUsers = [...this.users];
    this.sortUsers();
  }

  // Re-sort the user list when column heading is clicked
  sortUsers(): void {
    // Sorting time! Let's organize this user list
    this.filteredUsers.sort((userA, userB) => {
      // Start with no preference between the two users
      let result = 0;
      
      // Sort based on which column was clicked
      if (this.sortBy === 'username') {
        // Sort alphabetically by username
        result = userA.username.localeCompare(userB.username);
      } 
      else if (this.sortBy === 'email') {
        // Sort alphabetically by email
        result = userA.email.localeCompare(userB.email);
      }
      else if (this.sortBy === 'role') {
        // Sort by role (admin/user)
        result = userA.role.localeCompare(userB.role);
      }
      else if (this.sortBy === 'status') {
        // Convert boolean to number (false=0, true=1) for comparison
        const statusA = Number(userA.active);
        const statusB = Number(userB.active); 
        result = statusA - statusB;
      }
      else if (this.sortBy === 'createdAt') {
        // Convert dates to timestamps for comparison
        const timeA = userA.createdAt ? new Date(userA.createdAt).getTime() : 0;
        const timeB = userB.createdAt ? new Date(userB.createdAt).getTime() : 0;
        result = timeA - timeB;
      }
      
      // Flip the result if we're sorting descending
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  // Handle column header clicks to change sorting
  setSorting(column: string): void {
    // Check if we're already sorting by this column
    if (this.sortBy === column) {
      // Just toggle direction (A→Z becomes Z→A)
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, start with ascending sort
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    
    // Re-sort the list with new settings
    this.sortUsers();
  }

  // Get the icon to show in the column header
  getSortIcon(column: string): string {
    // Is this the column we're sorting by?
    if (this.sortBy !== column) {
      // Not sorted - show neutral icon
      return 'bi-arrow-down-up';
    }
    
    // Show up or down arrow based on sort direction
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }
}