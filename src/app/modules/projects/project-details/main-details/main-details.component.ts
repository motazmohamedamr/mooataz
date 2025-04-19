import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectDetailsVm, ProjectsClient } from '@core/api';
import { environment } from '@env/environment';
import { LayoutService } from '@metronic/layout';
import { TranslateService } from '@ngx-translate/core';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ChartComponent,
  ApexPlotOptions,
  ApexStroke,
  ApexGrid,
  ApexFill,
} from 'ng-apexcharts';
import { firstValueFrom } from 'rxjs';
export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  fill: ApexFill;
};
@Component({
  selector: 'app-main-details',
  templateUrl: './main-details.component.html',
  styleUrls: ['./main-details.component.scss'],
})
export class MainDetailsComponent implements OnInit {
  @Output() goToActivityTabEv = new EventEmitter<void>();
  @Output() goToTasks: EventEmitter<void> = new EventEmitter<void>();
  @Output() goToTeamEv: EventEmitter<void> = new EventEmitter<void>();
  @Input({ required: true }) projectDetails: ProjectDetailsVm;

  private readonly translate = inject(TranslateService);
  private readonly layoutService = inject(LayoutService);
  private readonly _projectsClient = inject(ProjectsClient);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('chart') chart: ChartComponent;
  financialSummary = signal(null);

  projectId: string;
  asideDisplay: boolean = false;

  translation: any;
  constructor() {}

  async ngOnInit() {
    this.projectId = this.route.snapshot.params.id;
    this.asideDisplay = this.layoutService.getProp('aside.display') as boolean;
    this.translation = await firstValueFrom(this.translate.get('Projects.dashboard'));
    const summaries = await firstValueFrom(
      this._projectsClient.getFinancialPositionSummary(
        this.projectId,
        environment.apiVersion
      )
    );
    this.financialSummary.set(summaries?.length ? summaries[0] : null);
  }

  goToActivityTab() {
    this.goToActivityTabEv.emit();
  }

  goToTasksTab() {
    this.goToTasks.emit();
  }
  goToTeamTab() {
    this.goToTeamEv.emit();
  }
}
