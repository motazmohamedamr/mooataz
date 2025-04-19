import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AccountListVm } from '@core/api';
import { ProjectsService } from '@modules/projects/projects.service';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent implements OnInit {
  private readonly _projectsService = inject(ProjectsService);
  private readonly route = inject(ActivatedRoute);
  private readonly _destreyRef = inject(DestroyRef);

  departmentUsersMap: Record<string, AccountListVm[]> = {};

  projectId: string = '';
  userSearchSig = signal({
    search: undefined,
    refetch: undefined,
  });

  assignees$ = toObservable(this.userSearchSig).pipe(
    debounceTime(200),
    distinctUntilChanged(),
    switchMap((obj: { search: string | undefined; refetch: number | undefined }) =>
      obj.search === undefined && obj.refetch === undefined
        ? this._projectsService.projectUsers$.pipe(
            map((assignees: Record<string, AccountListVm[]>) => {
              this.departmentUsersMap = assignees;
              const arr = [];
              for (let assignee of Object.values(assignees)) {
                arr.push(...assignee);
              }
              return arr;
            }),
            takeUntilDestroyed(this._destreyRef)
          )
        : this._projectsService.getUsers(this.projectId, obj.search)
    )
  );

  users = toSignal(this.assignees$, { initialValue: [], rejectErrors: true });

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params.id;
    this._projectsService.projectUsers$
      .pipe(takeUntilDestroyed(this._destreyRef))
      .subscribe((users) => (this.departmentUsersMap = users));
  }

  userChange(search: string) {
    this.userSearchSig.set({
      search,
      refetch: this.userSearchSig().refetch,
    });
  }

  refetchUsers() {
    this.userSearchSig.set({
      search: this.userSearchSig().search,
      refetch: Math.random(),
    });
  }
}
