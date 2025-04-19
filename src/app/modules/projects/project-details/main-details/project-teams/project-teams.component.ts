import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BusinessType } from '@core/api';
import {
  PROJECT_MANAGER_BUSINESSTYPE_VALUE,
  ProjectsService,
} from '@modules/projects/projects.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-project-teams',
  templateUrl: './project-teams.component.html',
  styleUrl: './project-teams.component.scss',
})
export class ProjectTeamsComponent implements OnInit, OnChanges {
  private readonly _projectsService = inject(ProjectsService);
  @Input() translation: any;
  @Output() goToTeamEv = new EventEmitter<void>();
  @Input({ required: true }) projectId: string;

  businessTypes: Record<number, string>;

  users = toSignal(
    this._projectsService.projectUsers$.pipe(
      map((users) => {
        const arr = [];
        for (let user of Object.values(users)) {
          arr.push(...user);
        }
        return arr;
      })
    ),
    { rejectErrors: true, initialValue: [] }
  );

  get totalMembers() {
    return this.translation?.teamMember?.replace('{{total}}', this.users().length);
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.translation?.currentValue) {
      const translation = changes?.translation?.currentValue;
      this.businessTypes = {
        [BusinessType.Architectural]: translation.businessTypes.Architectural,
        [BusinessType.Electrical]: translation.businessTypes.Electrical,
        [BusinessType.Mechanical]: translation.businessTypes.Mechanical,
        [BusinessType.Other]: translation.businessTypes.Other,
        [BusinessType.Structural]: translation.businessTypes.Structural,
        [BusinessType.Telecommunications]: translation.businessTypes.Telecommunications,
        [PROJECT_MANAGER_BUSINESSTYPE_VALUE]: translation.businessTypes.ProjectManager,
      };
    }
  }

  goToTeamTab() {
    this.goToTeamEv.emit();
  }
}

