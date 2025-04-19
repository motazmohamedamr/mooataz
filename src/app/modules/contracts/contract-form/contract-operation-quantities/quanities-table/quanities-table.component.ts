import { ContractQuantityFormComponent } from './../contract-quantity-form/contract-quantity-form.component';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FileParameter,
  IPageInfo,
  IProjectQuantityVm,
  PaginatedListOfProjectQuantityVm,
  ProjectMainDataVm,
  ProjectsClient,
  SavingType,
} from '@core/api';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { environment } from '@env/environment';
import { ContractFormService } from '@modules/contracts/shared/contract-form.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, first, Observable, take, tap, throwError } from 'rxjs';

@Component({
  selector: 'app-quanities-table',
  templateUrl: './quanities-table.component.html',
  styleUrl: './quanities-table.component.scss',
})
export class QuanitiesTableComponent implements OnInit {
  @Output() projectPriceChange = new EventEmitter<{
    oldTotalPrice?: number;
    totalPrice: number;
    operation: 'add' | 'edit' | 'delete' | 'replace';
  }>();

  @Input()
  translation: any;

  @Input({ required: true })
  selectedProject: ProjectMainDataVm;

  @Input({ required: true })
  allProjects: ProjectMainDataVm[];

  quantities: WritableSignal<IProjectQuantityVm[]> = signal([]);
  pagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });

  private readonly _projectClient = inject(ProjectsClient);
  protected readonly _translateService = inject(TranslateService);
  private readonly _contractFormService = inject(ContractFormService);
  private readonly _handler = inject(ApiHandlerService);
  private readonly dialog = inject(MatDialog);
  private readonly _toastrService = inject(ToastrService);

  ngOnInit(): void {
    this.getAllQuantities().subscribe();
  }

  getAllQuantities(): Observable<PaginatedListOfProjectQuantityVm> {
    return this._projectClient
      .getProjectQuantitiesPage(
        this.selectedProject.id,
        null,
        undefined,
        5,
        this.pagingOptions().pageIndex,
        undefined,
        this.pagingOptions().ascending,
        this.pagingOptions().sortingBy,
        environment.apiVersion
      )
      .pipe(
        take(1),
        tap((quantities: PaginatedListOfProjectQuantityVm) => {
          this.quantities.set(quantities.items);
          this.pagingOptions.set(quantities.pageInfo);
        })
      );
  }

  get paginationInfoText(): string {
    const currentPage = (this.pagingOptions().pageIndex || 0) + 1;
    const pageSize = 5;
    const total = this.pagingOptions().totalCount || 0;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return this._translateService
      .instant('general.table.paginationInfo')
      .replace('{{start}}', start.toString())
      .replace('{{end}}', end.toString())
      .replace('{{total}}', total.toString());
  }

  get hasPrevPage(): boolean {
    return (this.pagingOptions().pageIndex || 0) > 0;
  }

  get hasNextPage(): boolean {
    return (
      (this.pagingOptions().pageIndex || 0) < (this.pagingOptions().totalPages || 1) - 1
    );
  }

  nextPage(): void {
    const currentPage = this.pagingOptions().pageIndex || 0;
    this.pagingOptions.set({
      ...this.pagingOptions(),
      pageIndex: currentPage + 1,
    });
    this.getAllQuantities().subscribe();
  }

  viewPage(index: number): void {
    this.pagingOptions.set({
      ...this.pagingOptions(),
      pageIndex: index - 1,
    });
    this.getAllQuantities().subscribe();
  }

  get getPaginationPages(): number[] {
    const totalPages = this.pagingOptions().totalPages || 1;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  prevPage(): void {
    const currentPage = this.pagingOptions().pageIndex || 0;
    this.pagingOptions.set({
      ...this.pagingOptions(),
      pageIndex: currentPage - 1,
    });
    this.getAllQuantities().subscribe();
  }

  uploadQuantitiesTable(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File = target.files[0];

    const fileParam: FileParameter = {
      data: file,
      fileName: file.name,
    };

    this._projectClient
      .addQuantitiesByExcel(
        environment.apiVersion,
        fileParam,
        this._contractFormService.currentContractId(),
        this.selectedProject.id,
        SavingType.Save.toString()
      )
      .pipe(
        first(),
        catchError((err) => {
          this._handler.handleError(err.error).pushError();
          return throwError(err);
        })
      )
      .subscribe(() => {
        this._toastrService.success(
          this._translateService.instant(
            'contract.form.operations.quantitiesAddedSuccessfully'
          ),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
        this.getAllQuantities().subscribe(() => {
          this.projectPriceChange.emit({
            totalPrice: this.totalPriceOfQuantities,
            operation: 'replace',
          });
        });
      });
  }

  addNewQuantity(quantity: IProjectQuantityVm) {
    this.quantities.update((quantities) => [...quantities, quantity]);
  }

  get totalPriceOfQuantities(): number {
    return this.quantities().reduce(
      (prev, quantity) => (prev += quantity.quantity * quantity.unitPrice),
      0
    );
  }

  openNewQuantityDialog(): void {
    const dialogRef = this.dialog.open(ContractQuantityFormComponent, {
      width: '80%',
      data: {
        isDialog: true,
        allProjects: this.allProjects,
        selectedProject: this.selectedProject,
      },
    });
    dialogRef.componentInstance.save
      .pipe(take(1))
      .subscribe(
        (obj: {
          project: IProjectQuantityVm;
          totalPrice: number;
          operation: 'add' | 'edit' | 'delete';
        }) => {
          this.getAllQuantities().subscribe();
          this.projectPriceChange.emit({
            totalPrice: obj.totalPrice,
            operation: 'add',
          });
          dialogRef.close();
        }
      );
  }

  openEditDialog(quantity: IProjectQuantityVm) {
    const oldPrice: number = quantity.totalPrice;
    const dialogRef = this.dialog.open(ContractQuantityFormComponent, {
      width: '80%',
      data: {
        isDialog: true,
        allProjects: this.allProjects,
        selectedProject: this.selectedProject,
        quantityToBeEdited: quantity,
      },
    });
    dialogRef.componentInstance.save
      .pipe(take(1))
      .subscribe(
        (obj: {
          project: IProjectQuantityVm;
          totalPrice: number;
          operation: 'add' | 'edit' | 'delete';
        }) => {
          this.getAllQuantities().subscribe();
          this.projectPriceChange.emit({
            oldTotalPrice: oldPrice,
            totalPrice: obj.totalPrice,
            operation: 'edit',
          });
          dialogRef.close();
        }
      );
  }

  deleteQuantity(quantity: IProjectQuantityVm) {
    this._projectClient
      .deleteProjectQuantity(quantity.id, environment.apiVersion)
      .pipe(
        first(),
        tap(() => {
          this.quantities.update((quantities) =>
            quantities.filter((qua) => qua.id !== quantity.id)
          );
          this.projectPriceChange.emit({
            totalPrice: quantity.totalPrice,
            operation: 'delete',
          });
        })
      )
      .subscribe();
  }
}
