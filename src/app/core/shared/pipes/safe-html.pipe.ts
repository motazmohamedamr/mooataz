import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private _sanitized: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this._sanitized.bypassSecurityTrustHtml(value);
  }
}
