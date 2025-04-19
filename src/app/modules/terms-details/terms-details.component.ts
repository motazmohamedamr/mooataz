import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { first, firstValueFrom } from 'rxjs';
import { ProjectsClient } from '@core/api';
import { environment } from '@env/environment';
import { TermsDetailsService } from './terms-details.service';

@Component({
  selector: 'app-terms-details',
  templateUrl: './terms-details.component.html',
  styleUrl: './terms-details.component.scss',
})
export class TermsDetailsComponent implements OnInit, OnDestroy {
  private readonly _translateService = inject(TranslateService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _projectsClient = inject(ProjectsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);

  translation: any;
  termId: string = '';
  projectId: string = '';

  termDetails = this._termsDetailsService.termDetails;

  async ngOnInit() {
    // this.layout.displayToolbarSig.set(false);
    this.termId = this._route.snapshot.params.termId;
    this.projectId = this._route.snapshot.params.projectId;
    this._projectsClient
      .getProjectQuantity(this.termId, environment.apiVersion)
      .pipe(first())
      .subscribe((term) => this.termDetails.set(term));
    this.translation = await firstValueFrom(this._translateService.get('termsDetails'));
  }

  get measurementUnitName(): string {
    return this.termDetails()?.measurementUnitName[
      this._translateService.currentLang as 'ar' | 'en'
    ];
  }

  ngOnDestroy(): void {
    // this.layout.displayToolbarSig.set(true);
  }
}
