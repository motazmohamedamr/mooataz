import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AttachmentType,
  ChangeSupplierApprovalRequestStatusDto,
  FileAttachmentDto,
  FileResponse,
  ISupplierApprovalRequestSupplierVm,
  ProblemDetails,
  ProjectDropdownVm,
  ProjectQuantityDropdownVm,
  ProjectsClient,
  StorageClient,
  StorageFile,
  SupplierApprovalRequestDetailsVm,
  SupplierApprovalRequestDto,
  SupplierApprovalRequestPhase,
  SupplierApprovalRequestSupplierDto,
  SupplierApprovalsClient,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { first, firstValueFrom, forkJoin, Observable, switchMap, take, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { IdentityManager, User } from '@core/auth';
import { MatDialog } from '@angular/material/dialog';
import { RequestRejectionFormDialogComponent } from '../request-rejection-form-dialog/request-rejection-form-dialog.component';
import { getMimeTypeFromExtension } from '../shared/extension-to-mimetype';
import { LayoutService } from '@metronic/layout';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';

@Component({
  selector: 'app-supplier-approvals-form',
  templateUrl: './supplier-approvals-form.component.html',
  styleUrl: './supplier-approvals-form.component.scss',
})
export class SupplierApprovalsFormComponent implements OnInit, OnDestroy {
  private readonly _translateService = inject(TranslateService);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _toastr = inject(ToastrService);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly route = inject(ActivatedRoute);
  private readonly _supplierApprovalsClient = inject(SupplierApprovalsClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly layout = inject(LayoutService);

  translation: any;
  mode: 'add' | 'edit' | 'view' = 'add';
  requestId: string = '';
  isRejected: boolean = false;

  user: User;

  allProjects = toSignal(
    this._projectClient.getAll(environment.apiVersion).pipe(
      take(1),
      tap((projects) => {
        this.dropdownChanged(projects, this.projectId.value);
      })
    ),
    { initialValue: [], rejectErrors: true }
  );

  allTerms: WritableSignal<ProjectQuantityDropdownVm[]> = signal([]);

  suppliers: ISupplierApprovalRequestSupplierVm[] = [];

  newEditRequestForm = this.fb.group({
    projectId: ['', [Validators.required]],
    termId: ['', [Validators.required]],
    quantity: [1],
    notes: [null],
    phase: [{ value: null, disabled: true }],
    createdBy: [{ value: null, disabled: true }],
  });

  async ngOnInit() {
    this.layout.displayToolbarSig.set(false);
    const { mode, requestId, projId, isRejected } = this.route.snapshot.queryParams;
    this.mode = mode || 'add';
    this.requestId = requestId;
    this.isRejected = isRejected === 'true';
    this.user = this._identityManager.getUser();
    if (projId) {
      this.projectId.setValue(projId);
    }
    if (mode === 'edit' || mode === 'view') {
      this._supplierApprovalsClient
        .get(requestId, environment.apiVersion)
        .pipe(first())
        .subscribe((res: SupplierApprovalRequestDetailsVm) => {
          this.newEditRequestForm.patchValue({
            notes: res.notes,
            termId: res.termId,
            projectId: res.projectId,
            quantity: res.quantity,
            phase: res.phase,
            createdBy: res.createdBy,
          });
          this.suppliers = res.suppliers;
          if (
            mode === 'view' ||
            this.phase.value !== SupplierApprovalRequestPhase.ProjectManagerReview
          ) {
            this.newEditRequestForm.disable();
          }
        });
    }
    this.translation = await firstValueFrom(
      this._translateService.get('SupplierApproval.form')
    );
  }

  get projectId(): FormControl<string> {
    return this.newEditRequestForm.controls.projectId;
  }
  get termId(): FormControl<string> {
    return this.newEditRequestForm.controls.termId;
  }
  get quantity(): FormControl<number> {
    return this.newEditRequestForm.controls.quantity;
  }
  get notes(): FormControl<string> {
    return this.newEditRequestForm.controls.notes;
  }
  get phase() {
    return this.newEditRequestForm.controls.phase;
  }
  get createdBy() {
    return this.newEditRequestForm.controls.createdBy;
  }

  get acceptRejectMode() {
    return (
      this.user.id !== this.createdBy.value &&
      this.mode === 'view' &&
      this.phase.value === this.supplierApprovalRequestPhase.ProjectManagerReview
    );
  }

  dropdownChanged(projects: ProjectDropdownVm[], projectId: string | number) {
    const projectInd = projects.findIndex((s) => s.id === projectId);
    if (projectInd < 0) return;
    this.allTerms.set(projects[projectInd].quantities);
    if (
      projects[projectInd].quantities?.length > 0 &&
      (this.mode === 'add' || this.mode === undefined)
    ) {
      this.termId.setValue(projects[projectInd].quantities[0].id);
    }
  }

  private createNewRequest(): void {
    this._supplierApprovalsClient
      .create(
        environment.apiVersion,
        this.newEditRequestForm.value as SupplierApprovalRequestDto
      )

      .subscribe(
        () => {
          this.router.navigateByUrl('/supplier-approvals');
        },
        (err: ProblemDetails) =>
          this._toastr.error(err.detail, '', {
            positionClass: 'toast-bottom-center',
          })
      );
  }

  private updateRequest(): void {
    this._supplierApprovalsClient
      .update(
        this.requestId,
        environment.apiVersion,
        this.newEditRequestForm.value as SupplierApprovalRequestDto
      )

      .subscribe(
        () => {
          this.router.navigateByUrl('/supplier-approvals');
        },
        (err: ProblemDetails) =>
          this._toastr.error(err.detail, '', {
            positionClass: 'toast-bottom-center',
          })
      );
  }

  private callAccept(): Observable<void> {
    const request = {
      notes: this.notes.value || null,
      suppliers: this.suppliers.map(
        (supplier: ISupplierApprovalRequestSupplierVm) =>
          ({
            supplierId: supplier.supplierId,
            attachments: (
              supplier.attachments as (FileAttachmentDto & { file: File })[]
            ).map((attachment) => ({
              uniqueKey: attachment.uniqueKey,
              displayName: attachment.displayName,
              mimeType:
                attachment.file?.type || getMimeTypeFromExtension(attachment.extension),
              sizeInBytes: attachment.file?.size || 1,
            })),
            price: +supplier.price,
            selected: supplier.selected,
          } as SupplierApprovalRequestSupplierDto)
      ),
    };
    return this._supplierApprovalsClient
      .accept(
        this.requestId,
        environment.apiVersion,
        request as ChangeSupplierApprovalRequestStatusDto
      )
      .pipe(
        first(),
        tap(() => this.router.navigateByUrl('/supplier-approvals'))
      );
  }

  private acceptRequest(): void {
    this.callAccept().subscribe();
  }

  submitApproval() {
    if (
      this.acceptRejectMode ||
      this.phase.value === this.supplierApprovalRequestPhase.SupplierSelection
    ) {
      this.acceptRequest();
      return;
    }

    if (
      this.mode === 'edit' &&
      this.phase.value !== SupplierApprovalRequestPhase.ProjectManagerReview
    ) {
      const uploadFileObs: Observable<FileResponse>[] = [];

      const files: StorageFile[] = [];
      this.suppliers.forEach((supplier) => {
        supplier.attachments.forEach((attachment) => {
          files.push({
            file: (attachment as FileAttachmentDto & { file: any }).file,
            displayName: attachment.displayName,
            uniqueKey: attachment.uniqueKey,
          } as StorageFile);
        });
      });
      uploadFileObs.push(
        this._termsDetailsService.upload(
          environment.apiVersion,
          files,
          AttachmentType.ProjectFiles.toString()
        )
      );
      this.callAccept()
        .pipe(switchMap(() => forkJoin(uploadFileObs)))
        .subscribe();
      return;
    }

    if (this.mode === 'add') {
      this.createNewRequest();
    } else {
      this.updateRequest();
    }
  }

  get supplierApprovalRequestPhase(): typeof SupplierApprovalRequestPhase {
    return SupplierApprovalRequestPhase;
  }

  openRejectFormDialog() {
    const dialog = this.dialog.open(RequestRejectionFormDialogComponent, {
      width: '600px',
      data: {
        translation: this.translation,
        requestId: this.requestId,
        suppliers: this.suppliers,
      },
    });

    dialog.afterClosed().subscribe((data) => {
      if (data) {
        this.router.navigateByUrl('/supplier-approvals');
      }
    });
  }

  get noSelectedSuppliers(): boolean {
    return this.suppliers.every((s) => !s.selected);
  }

  ngOnDestroy(): void {
    this.layout.displayToolbarSig.set(true);
  }
}
