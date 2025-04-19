import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { DashboardReportsControllersClient, RequestsSummaryVM } from '@core/api';
import { finalize, first } from 'rxjs';
import { environment } from '@env/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectsService } from '@modules/projects/projects.service';

@Component({
  selector: 'app-requests-summary-charts',
  templateUrl: './requests-summary-charts.component.html',
  styleUrl: './requests-summary-charts.component.scss',
})
export class RequestsSummaryChartsComponent implements OnChanges, OnInit {
  @Input() translation: any;
  @Input() asideDisplay: boolean;

  loading = signal(true);
  statsKeysValues: { key: keyof RequestsSummaryVM; title: string }[] = [];

  private readonly _dashboardReportsControllersClient = inject(
    DashboardReportsControllersClient
  );
  private readonly _projectsService = inject(ProjectsService);
  requestsSummary = signal<RequestsSummaryVM[]>([]);

  ngOnInit(): void {
    this._dashboardReportsControllersClient
      .getRequestsSummary(environment.apiVersion)
      .pipe(
        first(),
        finalize(() => this.loading.set(false))
      )
      .subscribe(async (response) => {
        let items: RequestsSummaryVM[] = [];
        for await (const item of response) {
          item.siteImage = item.siteImage
            ? await this._projectsService.download(item.siteImage)
            : '';
          items.push(item);
        }
        this.requestsSummary.set(items);
        this.loading.set(false);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this.statsKeysValues = [
        { key: 'priceRequestsCount', title: this.translation?.priceRequests },
        { key: 'supplyRequestsCount', title: this.translation?.supplyRequests },
        { key: 'covenantRequestsCount', title: this.translation?.convenantRequests },
        { key: 'extractRequestsCount', title: this.translation?.extracts },
      ];
    }
  }
}
