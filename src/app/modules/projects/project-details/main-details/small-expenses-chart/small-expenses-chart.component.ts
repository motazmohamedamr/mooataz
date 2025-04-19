import { Component, Input, OnInit } from '@angular/core';
import { ChartOptions } from '../main-details.component';
import { FinancialPositionSummaryVM } from '@core/api';

@Component({
  selector: 'app-small-expenses-chart',
  templateUrl: './small-expenses-chart.component.html',
  styleUrl: './small-expenses-chart.component.scss',
})
export class SmallExpensesChartComponent implements OnInit {
  @Input() translation: any;
  @Input({ required: true }) financialSummary: FinancialPositionSummaryVM;
  chartOptions: Partial<ChartOptions>;

  ngOnInit(): void {
    this.chartOptions = {
      chart: {
        fontFamily: 'inherit',
        // height: 80,
        type: 'radialBar',
        width: '100%',
        height: '100%',
        offsetX: -20,
        offsetY: -30,
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 0,
            size: '60%',
          },
          dataLabels: {
            name: {
              show: false,
              fontSize: '19px',
              fontWeight: '700',
              // offsetY: -5,
              color: '#464E5F',
            },
            value: {
              color: '#5E6278',
              fontSize: '19px',
              fontWeight: '700',
              // offsetY: -40,
              show: false,
            },
          },
          track: {
            background: 'rgba(255, 255, 255, .25)',
            strokeWidth: '100%',
          },
        },
      },
      colors: ['#fff'],
      stroke: {
        lineCap: 'round',
        width: 10,
      },
    };
  }
}

