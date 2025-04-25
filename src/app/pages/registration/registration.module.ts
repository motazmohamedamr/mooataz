import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { RegistrationComponent } from './registration.component';
import { TelInputComponent } from './tel-input/tel-input.component';

@NgModule({
  declarations: [
    RegistrationComponent,
    TelInputComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  exports: [
    RegistrationComponent,
    TelInputComponent
  ]
})
export class RegistrationModule {}
