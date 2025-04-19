import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { TableColumn } from './table-column';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { CustomAction } from './custom-action';
import { SelectionModel } from '@angular/cdk/collections';
import { PaginatedFilter } from 'src/app/core/interfaces/PaginatedFilter';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, AfterViewInit {
  tableDataSource: MatTableDataSource<unknown>;
  selection: SelectionModel<any>;
  public displayedColumns: string[];

  //private isAllselected: boolean = false;

  @Input() customActionOneData: CustomAction;
  @Input() customActionfourData: CustomAction;
  @Input() customActionData: CustomAction;

  @Input() customActionDataTwo: CustomAction;
  @Input() customActionDataThree: CustomAction;

  searchString: string;
  @Input() totalCount: number;
  @Input() pageSize: number;
  @Output() onPageChanged = new EventEmitter<PaginatedFilter>();

  @Input() createPermssion: string;
  @Input() viewPermssion: string;
  @Input() updatePermssion: string;
  @Input() deletePermssion: string;

  @ViewChild(MatSort, { static: true }) matSort: MatSort;

  @Input() title: string;
  @Input() subtitle: string;

  @Input() isSortable = false;
  @Input() columns: TableColumn[];

  @Input() set data(data: unknown[]) {
    this.setTableDataSource(data);
  }

  @Output() onFilter: EventEmitter<string> = new EventEmitter<string>();
  @Output() onReload: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSort: EventEmitter<Sort> = new EventEmitter<Sort>();


  @Output() onCustomActionOne: EventEmitter<any> = new EventEmitter();
  @Output() onCustomAction: EventEmitter<any> = new EventEmitter();
  @Output() onCustomActionDataTwo: EventEmitter<any> = new EventEmitter();
  @Output() onCustomActionDataThree: EventEmitter<any> = new EventEmitter();
  @Output() onCustomActionDatafour: EventEmitter<any> = new EventEmitter();


  @Output() onCreateForm: EventEmitter<any> = new EventEmitter();
  @Output() onEditForm: EventEmitter<any> = new EventEmitter();
  @Output() onView: EventEmitter<any> = new EventEmitter();
  @Output() onDelete: EventEmitter<string> = new EventEmitter<string>();
  @Output() onِAllSelected: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onCheckBoxChecked: EventEmitter<any> = new EventEmitter<any>();

  constructor(public dialog: MatDialog) { }
  gold: EventEmitter<{ data: CustomAction }>[];
  ngOnInit(): void {
    const columnNames = this.columns.map(
      (tableColumn: TableColumn) => tableColumn.name
    );

    this.displayedColumns = columnNames;
  }

  ngAfterViewInit(): void {
    this.tableDataSource.sort = this.matSort;
  }

  setTableDataSource(data: any) {
    this.tableDataSource = new MatTableDataSource<unknown>(data);
    this.selection = new SelectionModel<any>(true,[]);
  }
  openCustomActionOne($event: any) {
    this.onCustomActionOne.emit($event);
  }

  handleCustomAction() {
    this.onCustomAction.emit(this.tableDataSource.data);
  }

  handleCustomActionTwo() {
    this.onCustomActionDataTwo.emit();
  }

  handleCustomActionThree() {
    this.onCustomActionDataThree.emit();
  }

  openCreateForm() {
    this.onCreateForm.emit();
  }

  openEditForm($event?:any) {
    this.onEditForm.emit($event);
  }
  openViewForm($event?:any) {
    this.onView.emit($event);
  }
  openCustomActionDatafour($event?:any) {
    this.onCustomActionDatafour.emit($event);
  }

  handleReload() {
    this.searchString = '';
    this.onReload.emit();
  }

  handleFilter() {
    this.onFilter.emit(this.searchString);
  }

  handleSort(sortParams: Sort) {
    const column = this.columns.find(
      (column) => column.name === sortParams.active
    );
    if (column) {
      sortParams.active = column.dataKey;
    } else {
      // Handle the case where column is not found
      console.error(`Column with name '${sortParams.active}' not found.`);
    }

    if (sortParams.direction == "") {
      sortParams.direction = "asc";
    }
    this.onSort.emit(sortParams);
  }

  openDeleteConfirmationDialog($event: string) {
    // const dialogRef = this.dialog.open(DeleteDialogComponent, {
    //   data: 'Do you confirm the removal of this Record?',
    // });
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.onDelete.emit($event);
    //   }
    // });
  }
  onPageChange(pageEvent: PageEvent) {
    const event: PaginatedFilter = {
      pageNumber: pageEvent.pageIndex + 1 ?? 1,
      pageSize: pageEvent.pageSize ?? 10,
    };
    this.onPageChanged.emit(event);
  }



  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.tableDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    console.log("Entered masterToggle");

    this.isAllSelected() ? this.selection.clear() : this.tableDataSource.data.forEach(row => this.selection.select(row));
    this.onCheckBoxChecked.emit(this.selection.selected);
  }

  selectHandler(row: unknown) {
      this.selection.toggle(row);
      this.onCheckBoxChecked.emit(this.selection.selected);
  }

  checkCheckBoxvalue($event : any, element:any)
  {
    console.log("$event",$event.checked);
    console.log("$element",element);

    var variable = {
      checked: $event.checked,
      id:element.id

    }

    this.onCheckBoxChecked.emit(variable);
  }

}
