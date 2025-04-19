import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { busTypes } from '../departments.component';
import { MatDialog } from '@angular/material/dialog';
import { AssignUserDialogComponent } from '../../assign-user-dialog/assign-user-dialog.component';
import { ProjectsService } from '@modules/projects/projects.service';
import { map, take } from 'rxjs';
import { AccountListVm } from '@core/api';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss',
})
export class DepartmentComponent {
  @Input({ required: true })
  department: busTypes;

  @Input()
  departmentUsers: AccountListVm[] = [];

  @Output()
  refetchUsers = new EventEmitter();

  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly _projectService = inject(ProjectsService);

  openAssignUserDialog() {
    this._projectService.projectUsers$
      .pipe(
        take(1),
        map((assignees: Record<string, AccountListVm[]>) => {
          const arr = [];
          if (assignees[this.department.value]) {
            for (let assignee of assignees[this.department.value]) {
              arr.push(assignee);
            }
          }
          return arr;
        })
      )
      .subscribe((accounts: AccountListVm[]) => {
        const dialog = this.dialog.open(AssignUserDialogComponent, {
          width: '65vw',
          data: {
            users: accounts,
            department: this.department,
            projectId: this.route.snapshot.params.id,
          },
        });
        dialog.afterClosed().subscribe((refetch: boolean) => {
          if (refetch) {
            this.refetchUsers.emit();
          }
        });
      });
  }
}
