import { Component, inject, Input, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard-stats-card',
  templateUrl: './dashboard-stats-card.component.html',
  styleUrl: './dashboard-stats-card.component.scss',
})
export class DashboardStatsCardComponent {
  protected readonly translate = inject(TranslateService);

  @Input() mode: 'primary' | 'secondary' = 'primary';
  @Input() title: string = '';
  @Input() statsResult: number = 0;
}

