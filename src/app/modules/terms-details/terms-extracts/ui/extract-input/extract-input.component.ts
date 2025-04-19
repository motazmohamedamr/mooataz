import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-extract-input',
  templateUrl: './extract-input.component.html',
  styleUrl: './extract-input.component.scss',
})
export class ExtractInputComponent implements OnDestroy {
  @Input() value: number = 0;

  @Output() changeValue = new EventEmitter<number>();

  private inputSubject = new Subject<number>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.inputSubject
      .pipe(
        debounceTime(500), // Wait 500ms after the last event
        takeUntil(this.destroy$) // Automatically unsubscribe on destroy
      )
      .subscribe((value) => {
        this.handleInput(value);
      });
  }

  handleInput(value: number): void {
    this.changeValue.emit(value);
  }

  onInputChange(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.inputSubject.next(+inputValue);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

