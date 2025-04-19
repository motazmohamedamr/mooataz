import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Component, OnInit, inject } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
})
export class RegistrationComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  globalTranslation: Record<'hero' | 'registration', unknown>;

  showPassword = false;
  showConfirmPassword = false;
  showLanguageDropdown = false;
  translation: Record<string, any>;
  registrationTranslation: Record<string, any>;

  contactModel = {
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  async ngOnInit(): Promise<void> {
    this.globalTranslation = await firstValueFrom(this.translate.get('homepage'));
    this.translation = this.globalTranslation.hero;
    this.registrationTranslation = this.globalTranslation.registration;
  }

  switchLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    window.location.reload();
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Form submitted:', this.contactModel);
      form.resetForm();
    }
  }
}
