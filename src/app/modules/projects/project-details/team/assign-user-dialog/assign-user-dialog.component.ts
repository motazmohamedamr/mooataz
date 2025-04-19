import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AccountListVm,
  AccountsClient,
  AssignUserDto,
  BusinessType,
  IAccountListVm,
  IAssignUserDto,
  ProjectsClient,
} from '@core/api';
import { busTypes } from '../departments/departments.component';
import { environment } from '@env/environment';
import { forkJoin, map, Observable, take, tap } from 'rxjs';
import { PROJECT_MANAGER_BUSINESSTYPE_VALUE } from '@modules/projects/projects.service';
import { toSignal } from '@angular/core/rxjs-interop';

type UserProject = IAccountListVm & { selected: boolean };

@Component({
  selector: 'app-assign-user-dialog',
  templateUrl: './assign-user-dialog.component.html',
  styleUrl: './assign-user-dialog.component.scss',
})
export class AssignUserDialogComponent implements OnInit {
  protected readonly data: {
    users: AccountListVm[];
    department: busTypes;
    projectId: string;
  } = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _dialogRef = inject(MatDialogRef);
  private readonly _accountClient = inject(AccountsClient);

  showDropdown: boolean = false;
  currentUsername: string = '';

  filteredSelectedUsers: UserProject[] = [];
  filteredNotSelectedUsers: UserProject[] = [];

  users$: Observable<UserProject[]> = this._accountClient
    .getList(environment.apiVersion)
    .pipe(
      map((users) =>
        users.map((user) => ({
          ...user,
          selected: this.data?.users.findIndex((u) => u.id === user.id) >= 0,
        }))
      ),
      tap((allUsers: UserProject[]) => {
        this.filteredSelectedUsers = allUsers.filter((user) => user.selected);
        this.filteredNotSelectedUsers = allUsers.filter((user) => !user.selected);
      })
    );
  private usersListDropdown: Signal<UserProject[]> = toSignal(this.users$, {
    initialValue: [],
  });
  private displayUsersDropdown = computed(() => signal(this.usersListDropdown()));

  protected displayUsersListDropdown = computed(() => this.displayUsersDropdown()());

  assignUserForm = this.fb.group({
    type: [0],
    userId: ['', [Validators.required]],
  });

  get type() {
    return this.assignUserForm.controls.type;
  }
  get userId() {
    return this.assignUserForm.controls.userId;
  }

  get assignManagerMode(): boolean {
    return this.data?.department?.value === PROJECT_MANAGER_BUSINESSTYPE_VALUE;
  }

  ngOnInit(): void {
    this.type.setValue(this.data?.department?.value);
  }

  toggleUser(user: UserProject, checked: boolean, userIndex: number): void {
    this.displayUsersDropdown().update((users) =>
      users.map((u) => (u.id === user.id ? { ...u, selected: checked } : u))
    );

    const filteredSelectedUserIdx = this.filteredSelectedUsers.findIndex(
      (u) => u.id === user.id
    );
    if (filteredSelectedUserIdx >= 0) {
      this.filteredSelectedUsers[filteredSelectedUserIdx].selected = checked;
    }

    const filteredNotSelectedUserIdx = this.filteredNotSelectedUsers.findIndex(
      (u) => u.id === user.id
    );
    if (filteredNotSelectedUserIdx >= 0) {
      this.filteredNotSelectedUsers[filteredNotSelectedUserIdx].selected = checked;
    }
  }

  submitForm() {
    const assignUsersObs$ = [];

    const filteredSelectedUsersChangedList: UserProject[] =
      this.filteredSelectedUsers.filter((user) => !user.selected);
    for (let selectedUser of filteredSelectedUsersChangedList) {
      assignUsersObs$.push(
        this._projectClient.removeUserFromProject(
          this.data.projectId,
          environment.apiVersion,
          { type: this.data.department.value, userId: selectedUser.id } as AssignUserDto
        )
      );
    }

    const filteredNotSelectedUsersChangedList: UserProject[] =
      this.filteredNotSelectedUsers.filter((user) => user.selected);

    if (this.assignManagerMode) {
      for (let nonSelectedUser of filteredNotSelectedUsersChangedList) {
        assignUsersObs$.push(
          this._projectClient.assignManagerToProject(
            this.data.projectId,
            environment.apiVersion,
            { type: BusinessType.Other, userId: nonSelectedUser.id } as AssignUserDto
          )
        );
      }
    } else {
      let assignedUsersDto: IAssignUserDto[] = [];

      if (filteredNotSelectedUsersChangedList.length) {
        for (let nonSelectedUser of filteredNotSelectedUsersChangedList) {
          assignedUsersDto.push({
            type: this.data.department.value,
            userId: nonSelectedUser.id,
          });
        }

        assignUsersObs$.push(
          this._projectClient.assignUsersToProject(
            this.data.projectId,
            environment.apiVersion,
            assignedUsersDto as AssignUserDto[]
          )
        );
      }
    }

    forkJoin(assignUsersObs$)
      .pipe(take(1))
      .subscribe(() => {
        this._dialogRef.close(true);
      });
  }
}
