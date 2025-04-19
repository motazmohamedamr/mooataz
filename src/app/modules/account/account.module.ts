import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileDetailsComponent } from './settings/forms/profile-details/profile-details.component';
import { SignInMethodComponent } from './settings/forms/sign-in-method/sign-in-method.component';
import { DropdownMenusModule, WidgetsModule } from '@metronic/partials';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { FactorAuthenticationComponent } from './settings/forms/sign-in-method/factor-authentication/factor-authentication.component';

@NgModule({
  declarations: [
    AccountComponent,
    SettingsComponent,
    ProfileDetailsComponent,
    SignInMethodComponent,
    FactorAuthenticationComponent,
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    DropdownMenusModule,
    WidgetsModule,
    SharedModule,
    TranslateModule,
  ],
})
export class AccountModule {}
