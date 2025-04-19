import { IAioTableFilter } from '@shared/components/aio-table/filters/aio-table-filter.interface';

declare var $: any;

export class MultiDropDownFilter implements IAioTableFilter {
  key: string;

  private readonly _title: string;
  private readonly _placeholder: string;
  private readonly _options: { [key: string]: string };

  constructor(
    key: string,
    title: string,
    placeholder: string,
    options: { [key: string]: string }
  ) {
    this.key = key;
    this._title = title;
    this._placeholder = placeholder;
    this._options = options;
  }

  getValue(): string {
    const select = document.getElementById(this.key) as HTMLSelectElement;
    return Array.from(select.selectedOptions)
      .map((option) => option.value)
      .join(',');
  }

  render(): string {
    setTimeout(() => {
      ($('#' + this.key) as any).select2();
    }, 100);

    const options = Object.entries(this._options)
      .map(([key, value]) => `<option value="${key}">${value}</option>`)
      .join('');

    return `
      <div class="mb-10">
        <label class="form-label fw-semibold">${this._title}:</label>
        <div>
            <select id="${this.key}" class="form-select form-select-solid" multiple="multiple" data-kt-select2="true" data-close-on-select="false" data-placeholder="${this._placeholder}" data-allow-clear="true">
                <option></option>
                ${options}
            </select>
        </div>
      </div>
      `;
  }
}
