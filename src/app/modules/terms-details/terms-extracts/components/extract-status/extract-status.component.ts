import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ExtractRequestPhase, ExtractRequestPhaseVm } from '@core/api';

type Step = {
  completed: boolean;
  title: string;
};

@Component({
  selector: 'app-extract-status',
  templateUrl: './extract-status.component.html',
  styleUrl: './extract-status.component.scss',
})
export class ExtractStatusComponent implements OnChanges {
  @Input() translation: any;
  @Input() phase: ExtractRequestPhaseVm;

  steps: Step[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.phase &&
      changes.phase.currentValue !== undefined &&
      changes.phase.currentValue !== null
    ) {
      this.steps = [
        {
          title: this.translation?.siteEngineer,
          completed: this.phase >= ExtractRequestPhaseVm.SiteEngineer,
        },
        {
          title: this.translation?.projectManager,
          completed: this.phase >= ExtractRequestPhaseVm.ProjectManagerReview,
        },
        {
          title: this.translation?.technicalOfficer,
          completed: this.phase >= ExtractRequestPhaseVm.TechnicalOfficeReview,
        },
        {
          title: this.translation?.projectsManager,
          completed: this.phase >= ExtractRequestPhaseVm.ProjectsManagerReview,
        },
        {
          title: this.translation?.generalManager,
          completed: this.phase >= ExtractRequestPhaseVm.GeneralManagerReview,
        },
        {
          title: this.translation?.accountant,
          completed: this.phase >= ExtractRequestPhaseVm.Accountant,
        },
        {
          title: this.translation?.TransferredPartial,
          completed: this.phase >= ExtractRequestPhaseVm.TransferredPartial,
        },
        {
          title: this.translation?.done,
          completed: this.phase >= ExtractRequestPhaseVm.Completed,
        },
      ];
    }
  }
}
