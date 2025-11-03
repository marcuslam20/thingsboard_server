///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'tb-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  signupForm: FormGroup;
  isLoading$ = new BehaviorSubject<boolean>(false);
  passwordMismatch = false;

  constructor(
    private fb: FormBuilder
    , private authService: AuthService
    , private router: Router
  ) {
    this.signupForm = this.fb.group({
      firstname: ['', Validators.required],  
      lastname: ['', Validators.required],  
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  signup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { firstname, lastname, email, password, confirmPassword } = this.signupForm.value;
    if (password !== confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.passwordMismatch = false;
    this.isLoading$.next(true);

    const payload = {
      firstName: firstname,
      lastName: lastname,
      email: email,
      password: password
    };

    this.authService.signup(payload).subscribe({
      next: (res) => {
        console.log('Signup success:', res);
        alert('Signup successful!');
        this.router.navigate(['/login']); // Redirect to login page after successful signup
      },
      error: (err) => {
        console.error('Signup failed:', err);
        alert(err.error?.message || 'Signup failed');
      },
      complete: () => this.isLoading$.next(false)
    });
    
    setTimeout(() => {
      console.log('Signup data:', this.signupForm.value);
      this.isLoading$.next(false);
      alert('Sign up successful! (demo)');
    }, 2000);
  }
}
