import { ActivatedRoute } from '@angular/router';
import { BusinessType, ProjectsClient } from './../../../../core/api';
import {
  Component,
  WritableSignal,
  signal,
  inject,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  HostListener,
  DestroyRef,
} from '@angular/core';
import {
  IPageInfo,
  IProjectQuantityVm,
  PaginatedListOfProjectQuantityVm,
  ProjectMainDataVm,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, take, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-terms-table',
  templateUrl: './terms-table.component.html',
  styleUrl: './terms-table.component.scss',
})
export class TermsTableComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  @Output() selectTermEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() goToTasksAndFilter: EventEmitter<IProjectQuantityVm> =
    new EventEmitter<IProjectQuantityVm>();

  translation: any;
  selectedProject: ProjectMainDataVm;

  gridView = signal(true);

  quantitiesScroll: WritableSignal<IProjectQuantityVm[]> = signal([]);
  quantities: WritableSignal<IProjectQuantityVm[]> = signal([]);
  pagingOptions: WritableSignal<IPageInfo> = signal({
    ascending: false,
    pageIndex: 0,
    sortingBy: null,
    totalCount: 1,
    totalPages: 1,
  });

  get getPaginationPages(): number[] {
    const totalPages = this.pagingOptions().totalPages || 1;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  businessType: BusinessType;
  projectId: string;
  offset: number = 5;
  lastScrollTop = 0;
  scrollCounter = 0;
  private readonly _projectClient = inject(ProjectsClient);
  protected readonly _translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  async ngOnInit() {
    this.projectId = this.route.snapshot.params.id;

    this.getAllQuantities().subscribe();
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.quantities')
    );
  }

  setGridView(bool: boolean) {
    this.gridView.set(bool);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.gridView()) return;
    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    // Check if scrolling down
    if (scrollTop > this.lastScrollTop) {
      const maxScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      // Example condition: Trigger when scrolled past 70% of the page
      if (scrollTop > maxScroll * 0.99) {
        // if (this.scrollCounter < this.pagingOptions().totalPages) {
        this.pagingOptions().pageIndex = this.pagingOptions().pageIndex + 1;

        let arr: any[] = this.quantitiesScroll();
        if (this.pagingOptions().pageIndex < this.pagingOptions().totalPages) {
          this.getAllQuantities().subscribe((d) => {
            arr.push(...d.items);
            this.quantitiesScroll.set(arr);

            this.changeDetectorRef.detectChanges();
          });
        }
        this.scrollCounter = this.scrollCounter + 1;
        // }
      }
    }

    // Update the last scroll position
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  goToPageHandler(page: number) {
    this.pagingOptions.update((options) => ({
      ...options,
      pageIndex: page,
    }));
    this.getAllQuantities().subscribe();
  }

  refreshQuantities(data: { ascending: boolean; sortingBy: string }) {
    this.getAllQuantities(data.ascending, data.sortingBy).subscribe();
  }

  getAllQuantities(
    ascending: boolean = false,
    sortingBy: string = undefined
  ): Observable<PaginatedListOfProjectQuantityVm> {
    return this._projectClient
      .getProjectQuantitiesPage(
        this.projectId,
        this.businessType,
        undefined,
        this.offset,
        this.pagingOptions().pageIndex,
        undefined,
        ascending,
        sortingBy,
        environment.apiVersion
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((quantities: PaginatedListOfProjectQuantityVm) => {
          this.quantities.set(quantities.items);
          this.pagingOptions.set(quantities.pageInfo);
          this.quantitiesScroll.set(quantities.items);
          this.changeDetectorRef.detectChanges();
        })
      );
  }

  detectChange() {
    this.changeDetectorRef.detectChanges();
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
  prevPage(): void {
    const currentPage = this.pagingOptions().pageIndex || 0;
    this.pagingOptions.set({
      ...this.pagingOptions(),
      pageIndex: currentPage - 1,
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

  getTermId(e: string): void {
    this.selectTermEvent.emit(e);
  }

  goToTasks(quantity: IProjectQuantityVm) {
    this.goToTasksAndFilter.emit(quantity);
  }
}
