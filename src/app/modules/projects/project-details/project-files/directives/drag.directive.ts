import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appProjectFileDrag]',
})
export class ProjectFileDragDirective {
  @Output() fileDropped: EventEmitter<File> = new EventEmitter();

  @HostBinding('style.background') private background = '#E9F3FF';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#fff';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#E9F3FF';
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    this.background = '#E9F3FF';
  }
}
