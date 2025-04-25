import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HomepageComponent } from './homepage.component';


import { HeroSectionComponent } from './hero-section/hero-section.component';
import { WhyMotabeaSectionComponent } from './why-motabea-section/why-motabea-section.component';
import { FeaturesSectionComponent } from './features-section/features-section.component';
import { PricingSectionComponent } from './pricing-section/pricing-section.component';
import { ContactSectionComponent } from './contact-section/contact-section.component';
import { FooterSectionComponent } from './footer-section/footer-section.component';

@NgModule({
  declarations: [
    HomepageComponent,
    HeroSectionComponent,
    WhyMotabeaSectionComponent,
    FeaturesSectionComponent,
    PricingSectionComponent,
    ContactSectionComponent,
    FooterSectionComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    HomepageComponent
  ]
})
export class HomepageModule {}