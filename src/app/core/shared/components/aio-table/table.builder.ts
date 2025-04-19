import { BehaviorSubject } from 'rxjs';
import { PagingOptions } from './paging.options';
import { IAioTableColumn } from '@shared/components/aio-table/columns/aio-table-column.interface';
import { IAioTableFilter } from '@shared/components/aio-table/filters/aio-table-filter.interface';
import { AioTableSelectionAction } from '@shared/components/aio-table/actions/custom-action';

export class TableBuilder<T> {
  private _multipleSelection = false;
  private _columns: Array<IAioTableColumn<T>> = [];
  private _filters: Array<IAioTableFilter> = [];
  private _selectionActions: Array<AioTableSelectionAction<T>> = [];
  private _canEdit: (item: T) => boolean;
  private _canDelete: (item: T) => boolean;
  private _canChangeStatus: (item: T) => boolean;

  constructor(
    public dataSource$: BehaviorSubject<T[]>,
    public pagingOptions$: BehaviorSubject<PagingOptions>
  ) {}

  get columns(): Array<IAioTableColumn<T>> {
    return this._columns;
  }

  get filters(): Array<IAioTableFilter> {
    return this._filters;
  }

  get canMultiSelect(): boolean {
    return this._multipleSelection;
  }

  get hasActions(): boolean {
    return this.hasSelectionActions || !!this.canEdit || !!this.canDelete;
  }

  get hasSelectionActions(): boolean {
    return this.selectionActions && this._selectionActions.length > 0;
  }

  get selectionActions(): Array<AioTableSelectionAction<T>> {
    return this._selectionActions;
  }

  canEdit(item: T): boolean {
    if (!this._canEdit) {
      return false;
    }

    return this._canEdit(item);
  }

  canDelete(item: T): boolean {
    if (!this._canDelete) {
      return false;
    }

    return this._canDelete(item);
  }

  canChangeStatus(item: T): boolean {
    if (!this._canChangeStatus) {
      return false;
    }

    return this._canChangeStatus(item);
  }

  withMultipleSelection(): TableBuilder<T> {
    this._multipleSelection = true;
    return this;
  }

  withColumns(columns: { [key: string]: IAioTableColumn<T> }): TableBuilder<T> {
    this._columns = Object.values(columns);
    return this;
  }

  withFilters(filters: { [key: string]: IAioTableFilter }): TableBuilder<T> {
    this._filters = Object.values(filters);
    return this;
  }

  withSelectionActions(actions: {
    [key: string]: AioTableSelectionAction<T>;
  }): TableBuilder<T> {
    this._selectionActions = Object.values(actions);
    return this;
  }

  canEditIf(predicate?: (item: T) => boolean): TableBuilder<T> {
    this._canEdit = predicate || (() => true);
    return this;
  }

  canDeleteIf(predicate?: (item: T) => boolean): TableBuilder<T> {
    this._canDelete = predicate || (() => true);
    return this;
  }

  canChangeStatusIf(predicate?: (item: T) => boolean): TableBuilder<T> {
    this._canChangeStatus = predicate || (() => true);
    return this;
  }
}
