import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileManagerService {
  private _signatures: any = {
    pdf: {
      key: 'JVBERi0',
      type: 'application/pdf',
    },
    gif: {
      key: 'R0lGODdh',
      type: 'image/gif',
    },
    gif2: {
      key: 'R0lGODlh',
      type: 'image/gif',
    },
    png: {
      key: 'iVBORw0KGgo',
      type: 'image/png',
    },
    jpg: {
      key: '/9j/2w',
      type: 'image/jpg',
    },
    jpeg: {
      key: '/9j/7g',
      type: 'image/jpeg',
    },
  };

  reloadVideo(name?: string): void {
    const col = document.getElementsByTagName('video');
    const ele = name ? col.namedItem(name) : col[0];

    if (ele) {
      ele.load();
    }
  }

  createObjectUrl(obj: Blob | string | any, contentType?: string): string {
    if (obj instanceof Blob) {
      return window.URL.createObjectURL(obj);
    } else if (typeof obj === 'string') {
      return window.URL.createObjectURL(this.base64ToBlob(obj, contentType));
    } else {
      return window.URL.createObjectURL(obj);
    }
  }

  onFileSelected(upload: FileList, form: FormGroup, control: string): string {
    if (upload && upload[0]) {
      const file = upload[0];

      form.markAsDirty();

      form.patchValue({
        [control]: file,
        fileName: file.name,
      });

      return window.URL.createObjectURL(file);
    }

    return null;
  }

  base64ToBlob(data: string, contentType?: string): Blob {
    const b64 = data.split(',').pop();
    const byteCharacters = atob(b64);

    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const type = contentType || this.detectMimeType(b64);
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  detectMimeType(b64: string) {
    for (const s in this._signatures) {
      if (!this._signatures.hasOwnProperty(s)) {
        continue;
      }

      const type = this._signatures[s];

      if (b64.indexOf(type.key) === 0) {
        return type.type;
      }
    }
  }
}
