import {IAioTableFilter} from '@shared/components/aio-table/filters/aio-table-filter.interface';

export class RadioButtonFilter implements IAioTableFilter {
  key: string;

  private readonly _title: string;
  private readonly _value: string;

  constructor(key: string, title: string, value: string) {
    this.key = key;
    this._title = title;
    this._value = value;
  }

  getValue(): string {
    const radio = document.getElementById(this.key) as HTMLInputElement;
    return radio.checked ? this._value : '';
  }

  render(): string {
    return `
    <div class="mb-10">
      <label class="form-label fw-semibold">${this._title}:</label>
      <div class="form-check form-switch form-switch-sm form-check-custom form-check-solid">
        <input id="${this.key}" class="form-check-input" type="checkbox" value="" name="${this.key}" checked="checked" />
        <label class="form-check-label">${this._value}</label>
      </div>
    </div>
    `;
  }
}
