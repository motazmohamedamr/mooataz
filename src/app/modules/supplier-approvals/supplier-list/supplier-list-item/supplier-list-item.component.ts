import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FileAttachmentDto,
  ISupplierApprovalRequestSupplierVm,
  StorageClient,
  SupplierApprovalRequestPhase,
} from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { SupplierAttachment } from '../supplier-list.component';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { environment } from '@env/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs';

@Component({
  selector: 'app-supplier-list-item',
  templateUrl: './supplier-list-item.component.html',
  styleUrl: './supplier-list-item.component.scss',
})
export class SupplierListItemComponent {
  @Input({ required: true })
  supplier: ISupplierApprovalRequestSupplierVm;

  @Input({ required: true })
  phase: number = 0;

  @Output()
  fileAddedToSupplier = new EventEmitter<{
    supplierAttachment: SupplierAttachment;
    supplierId: string;
  }>();

  @Output()
  deleteFile = new EventEmitter<{ uniqueKey: string; supplierId: string }>();

  @Output()
  toggleSupplier = new EventEmitter<{ checked: boolean; supplierId: string }>();

  @Output()
  deleteSupplier = new EventEmitter<string>();

  protected readonly translate = inject(TranslateService);
  protected readonly _storage = inject(StorageClient);
  protected readonly _http = inject(HttpClient);
  protected readonly _toastr = inject(ToastrService);

  toggleSupplierHandler(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const checked = target.checked;
    this.toggleSupplier.emit({
      supplierId: this.supplier.supplierId,
      checked,
    });
  }

  get selectMode(): boolean {
    return this.phase === SupplierApprovalRequestPhase.SupplierSelection;
  }

  uploadFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files[0];
    const filenameArr = file.name.split('.');
    this.fileAddedToSupplier.emit({
      supplierAttachment: {
        sizeInBytes: file.size,
        displayName: file.name,
        mimeType: file.type,
        extension: filenameArr[filenameArr.length - 1],
        uniqueKey: generateGUID(),
        file: file,
      },
      supplierId: this.supplier.supplierId,
    });
  }

  removeFile(uniqueKey: string) {
    this.deleteFile.emit({ supplierId: this.supplier.supplierId, uniqueKey });
  }

  removeSupplier() {
    this.deleteSupplier.emit(this.supplier.supplierId);
  }

  downloadAttachment(attachment: FileAttachmentDto): void {
    let url_ = environment.apiBaseUrl + '/api/v{apiVersion}/storage/{uniqueKey}/download';
    url_ = url_.replace('{uniqueKey}', encodeURIComponent('' + attachment.uniqueKey));
    url_ = url_.replace('{apiVersion}', encodeURIComponent('' + environment.apiVersion));
    url_ = url_.replace(/[?&]$/, '');

    let options_: any = {
      observe: 'response',
      responseType: 'blob',
      headers: new HttpHeaders({
        Accept: 'application/octet-stream',
      }),
    };

    this._http
      .request('get', url_, options_)
      .pipe(first())
      .subscribe((res) => {
        const blob = (res as any).body;
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = attachment.displayName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this._toastr.success(
          this.translate.instant('Projects.files.downloadComplete'),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }
}
