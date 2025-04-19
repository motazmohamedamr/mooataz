import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { DashboardReportsControllersClient, FinancialPositionSummaryVM } from '@core/api';
import { finalize, first, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectsService } from '@modules/projects/projects.service';

@Component({
  selector: 'app-financial-position-summary-charts',
  templateUrl: './financial-position-summary-charts.component.html',
  styleUrl: './financial-position-summary-charts.component.scss',
})
export class FinancialPositionSummaryChartsComponent implements OnInit, OnChanges {
  @Input() translation: any;
  @Input() asideDisplay: boolean;

  loading = signal(true);
  iconColors: Record<number, { svgIconFill: string; paddingColor: string }> = {
    0: { svgIconFill: '#3699FF', paddingColor: '#3699FF1F' },
    1: { svgIconFill: '#F64E60', paddingColor: '#F64E601F' },
    2: { svgIconFill: '#00AB9A', paddingColor: '#00AB9A1F' },
  };
  financialPositionSummary = signal<FinancialPositionSummaryVM[]>([]);

  statsKeysValues: { key: keyof FinancialPositionSummaryVM; title: string }[] = [];

  private readonly _dashboardReportsControllersClient = inject(
    DashboardReportsControllersClient
  );
  private readonly _projectsService = inject(ProjectsService);

  ngOnInit(): void {
    this._dashboardReportsControllersClient
      .getFinancialPositionSummary(environment.apiVersion)
      .pipe(
        first(),
        finalize(() => this.loading.set(false))
      )
      .subscribe(async (response) => {
        let items: FinancialPositionSummaryVM[] = [];
        for await (const item of response) {
          item.siteImage = item.siteImage
            ? await this._projectsService.download(item.siteImage)
            : '';
          items.push(item);
        }
        this.financialPositionSummary.set(items);
        this.loading.set(false);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        { key: 'totalValue', title: this.translation?.finalValue },
        { key: 'actualValue', title: this.translation?.actualValue },
      ];
    }
  }
}
