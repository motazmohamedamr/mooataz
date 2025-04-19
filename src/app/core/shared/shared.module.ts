import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { TableComponent } from './components/table/table.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { DropzoneDirective } from '../directives/dragAndDrop.directive';
import { ProgressComponent } from './components/progress/progress.component';
import { LoadingComponent } from './components/loading/loading.component';
import { KeeniconComponent } from './components/keenicon/keenicon.component';
import { HttpClientModule } from '@angular/common/http';
import { CamelCaseToTextPipe } from '@shared/pipes/camel-case-to-text.pipe';
import { CapitalizePipe } from '@shared/pipes/capitalize.pipe';
import { TrimPipe } from '@shared/pipes/trim.pipe';
import { PluralPipe } from '@shared/pipes/plural.pipe';
import { SafeUrlPipe } from '@shared/pipes/safe-url.pipe';
import { NumberWithCommasPipe } from '@shared/pipes/number-with-commas.pipe';
import { TimingPipe } from '@shared/pipes/timing.pipe';
import { TakePipe } from '@shared/pipes/take.pipe';
import { ParseUrlPipe } from '@shared/pipes/parse-url.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { StripHtmlPipe } from '@shared/pipes/strip-html.pipe';
import { DataPropertyGetterPipe } from '@shared/pipes/data-property-getter.pipe';
import { FilterOptionsComponent } from '@shared/components/aio-table/filter-options/filter-options.component';
import { LogoutDialogComponent } from './components/logout-dialog/logout-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { AccessDenialComponent } from '@shared/components/access-denial/access-denial.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MaterialModule } from '@core/material/material.module';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MultiSelectComponent } from './components/multi-select/multi-select.component';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { ServerErrorComponent } from './components/server-error/server-error.component';
import { AioTableComponent } from '@shared/components/aio-table/aio-table.component';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { HasRoleDirective } from '@core/auth/permissions/has-role.directive';
import { IsDefaultTenantDirective } from '@core/auth/permissions/is-default-tenant.directive';
import { HasPermissionDirective } from '@core/auth/permissions/has-permission.directive';
import { CanAccessDirective } from '@core/auth/permissions/can-access.directive';
import { HijriDatePickerComponent } from './components/hijri-date-picker/hijri-date-picker.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatOptionModule } from '@angular/material/core';
import { SelectWithSearchComponent } from './components/select-with-search/select-with-search.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { HalfCircleChartComponent } from './components/half-circle-chart/half-circle-chart.component';
import { TimeFormatPipe } from './pipes/time-format.pipe';

const DIRECTIVES = [
  DropzoneDirective,
  HasRoleDirective,
  HasPermissionDirective,
  CanAccessDirective,
  IsDefaultTenantDirective,
];

const PIPES = [
  CamelCaseToTextPipe,
  CapitalizePipe,
  TrimPipe,
  PluralPipe,
  SafeUrlPipe,
  NumberWithCommasPipe,
  TimingPipe,
  TakePipe,
  ParseUrlPipe,
  SafeHtmlPipe,
  StripHtmlPipe,
  SafeUrlPipe,
  DataPropertyGetterPipe,
  TimeFormatPipe,
];

const THIRD_MODULES = [
  TranslateModule,
  NgbModule,
  ToastrModule.forRoot({
    positionClass: 'toast-bottom-right',
    preventDuplicates: true,
  }),
];

const COMMON_MODULES = [
  CommonModule,
  FormsModule,
  RouterModule,
  ReactiveFormsModule,
  HttpClientModule,
];

@NgModule({
  declarations: [
    ...PIPES,
    ...DIRECTIVES,
    TableComponent,
    LogoutDialogComponent,
    ProgressComponent,
    ProgressComponent,
    LoadingComponent,
    ConfirmationDialogComponent,
    KeeniconComponent,
    LogoutDialogComponent,
    FileUploaderComponent,
    KeeniconComponent,
    NotFoundComponent,
    DeleteDialogComponent,
    AioTableComponent,
    FileUploadComponent,
    MultiSelectComponent,
    ServerErrorComponent,
    FilterOptionsComponent,
    AccessDenialComponent,
    DeleteDialogComponent,
    SelectWithSearchComponent,
    MultiSelectComponent,
    ServerErrorComponent,
    FileUploadComponent,
    NotFoundComponent,
    ImageUploaderComponent,
    HijriDatePickerComponent,
    CustomInputComponent,
    PaginationComponent,
    HalfCircleChartComponent,
  ],
  imports: [...COMMON_MODULES, ...THIRD_MODULES, MaterialModule],
  providers: [
    ToastrService,
    // BrandApiService, CategoryApiService, ProductApiService,
    // CustomerApiService,
    // IdentityApiService, UserApiService, RoleApiService, RolesService, UsersService
  ],
  exports: [
    ...PIPES,
    ...DIRECTIVES,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    TableComponent,
    ProgressComponent,
    MatCheckboxModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    AccessDenialComponent,
    LoadingComponent,
    KeeniconComponent,
    AioTableComponent,
    FilterOptionsComponent,
    MatDialogModule,
    NgxMatSelectSearchModule,
    DeleteDialogComponent,
    SelectWithSearchComponent,
    FileUploadComponent,
    MatButtonModule,
    ConfirmationDialogComponent,
    KeeniconComponent,
    NotFoundComponent,
    MultiSelectComponent,
    ServerErrorComponent,
    LogoutDialogComponent,
    PaginationComponent,
    FileUploaderComponent,
    DeleteDialogComponent,
    MultiSelectComponent,
    ServerErrorComponent,
    FileUploadComponent,
    CustomInputComponent,
    NotFoundComponent,
    ImageUploaderComponent,
    HijriDatePickerComponent,
  ],
})
export class SharedModule {}
