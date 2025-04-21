import { Component, Input, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-contact-section',
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.scss',
})
export class ContactSectionComponent {
  @Input()
  translation: Record<string, any>;

  contactModel = {
    fullName: '',
    email: '',
    message: '',
  };

  public readonly translate = inject(TranslateService);

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Form submitted:', this.contactModel);
      form.resetForm();
    }
  }
}
