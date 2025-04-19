import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tasks-logs',
  templateUrl: './tasks-logs.component.html',
  styleUrl: './tasks-logs.component.scss',
})
export class TasksLogsComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  translation: Record<string, string>;

  async ngOnInit(): Promise<void> {
    this.translation = await firstValueFrom(this.translate.get('Projects.activityLogs'));
  }
}

