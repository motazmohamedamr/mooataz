import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss']
})
export class MultiSelectComponent {
  @Input() values: string[] = [];
  @Input() selectedValues: string[] = [];
  @Output() selectedValuesChange: EventEmitter<string[]> = new EventEmitter<string[]>();

  selectAll(checked: boolean): void {
    if (checked) {
      this.selectedValues = [...this.values];
    } else {
      this.selectedValues = [];
    }
    this.selectedValuesChange.emit(this.selectedValues);
  }

  toggleSelection(value: string): void {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(value);
    }
    this.selectedValuesChange.emit(this.selectedValues);
  }
}
