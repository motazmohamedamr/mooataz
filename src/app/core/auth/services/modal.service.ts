import { Injectable } from '@angular/core';
import * as bootstrap from 'bootstrap';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modals: { [key: string]: bootstrap.Modal } = {};

  get(key: string): bootstrap.Modal {
    const selector = this.getSelector(key);

    let modal = this.modals[selector];

    if (modal) {
      return modal;
    }

    const options = this.getOptions();

    this.modals[selector] = modal = new bootstrap.Modal(
      document.querySelector(selector),
      options
    );

    return modal;
  }

  getRawElement(key: string): HTMLElement {
    return document.querySelector(this.getSelector(key));
  }

  dispose(key: string): void {
    delete this.modals[this.getSelector(key)];
  }

  private getSelector(key: string): string {
    return `#${key}`;
  }

  private getOptions(): any {
    return {
      keyboard: true,
      focus: true,
    };
  }
}
