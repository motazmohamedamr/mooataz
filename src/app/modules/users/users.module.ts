import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';
import { UsersComponent } from '@modules/users/users.component';
import { UsersTableComponent } from '@modules/users/users-table/users-table.component';
import { UsersRoutingModule } from '@modules/users/users-routing.module';
import { UsersCreateUpdateComponent } from '@modules/users/users-table/users-create-update/users-create-update.component';
import { RolesSelectorComponent } from '@modules/users/users-table/users-create-update/roles-selector/roles-selector.component';

@NgModule({
  declarations: [
    UsersComponent,
    UsersTableComponent,
    UsersCreateUpdateComponent,
    RolesSelectorComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    SharedModule,
    TranslateModule,
    RouterOutlet,
    UsersRoutingModule,
  ],
})
export class UsersModule {}
