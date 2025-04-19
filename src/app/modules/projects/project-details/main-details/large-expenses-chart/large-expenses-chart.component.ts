import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { DashboardReportsControllersClient, ExpensesVM, ProjectsClient } from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-large-expenses-chart',
  templateUrl: './large-expenses-chart.component.html',
  styleUrl: './large-expenses-chart.component.scss',
})
export class LargeExpensesChartComponent implements OnInit, OnChanges {
  private readonly _projectsClient = inject(ProjectsClient);
  private readonly _translateService = inject(TranslateService);
  @Input({ required: true }) projectId: string;
  @Input() translation: any;
  chartOptions: any;

  years = signal([]);

  expensesSummary = signal<ExpensesVM[] | null>(null);
  originalExpensesSummary = signal<ExpensesVM[] | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      this.translation = changes?.translation?.currentValue;
      this._projectsClient
        .getExpensesSummary(this.projectId, undefined, environment.apiVersion)
        .pipe(first())
        .subscribe((summary) => {
          this.originalExpensesSummary.set(summary);
          const expensesByYear = summary.filter(
            (summary) => summary.year === this.currentYear
          );
          this.expensesSummary.set(expensesByYear);
          const yearsSet = new Set();
          summary.forEach((i) => yearsSet.add(i.year));
          this.years.set([...yearsSet]);
          this.drawChart();
        });
    }
  }

  drawChart() {
    const monthlyData = new Array(12).fill(0);
    this.expensesSummary().forEach((item) => {
      const monthIndex = item.month - 1;
      monthlyData[monthIndex] = item.totalPaid;
    });
    this.chartOptions = {
      series: [
        {
          name: this.translation?.expenses,
          data: monthlyData,
          type: 'bar',
          stacked: true,
        },
      ],
      chart: {
        fontFamily: 'inherit',
        stacked: true,
        height: 350,
        type: 'bar',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          dataLabels: {
            position: 'top',
          },
        },
      },
      stroke: {
        curve: 'smooth',
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: '#B5B5C3',
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        labels: {
          offsetX: this._translateService.currentLang === 'ar' ? -30 : 0,
          style: {
            colors: '#158456',
            fontSize: '12px',
          },
        },
      },
      fill: {
        opacity: 1,
      },
      states: {
        normal: {
          filter: {
            type: 'none',
            value: 0,
          },
        },
        hover: {
          filter: {
            type: 'none',
            value: 0,
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'none',
            value: 0,
          },
        },
      },
      colors: ['#158456'],
    };
  }

  ngOnInit(): void {}

  get currentYear() {
    return new Date().getFullYear();
  }

  yearChanged(ev: MatSelectChange) {
    const expensesByYear = this.originalExpensesSummary().filter(
      (summary) => summary.year === ev.value
    );
    this.expensesSummary.set(expensesByYear);
    this.drawChart();
  }
}

