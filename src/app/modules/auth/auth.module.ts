import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AuthComponent } from './auth.component';
import { TranslateModule } from '@ngx-translate/core';
import { ResetComponent } from '@modules/auth/components/reset-password/reset.component';
import { SendOtpComponent } from '@modules/account/settings/forms/sign-in-method/factor-authentication/send-otp/send-otp.component';

@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    ResetComponent,
    AuthComponent,
    SendOtpComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    HttpClientModule,
  ],
})
export class AuthModule {}
