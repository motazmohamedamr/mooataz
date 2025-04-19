import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dotted-box',
  templateUrl: './dotted-box.component.html',
  styleUrl: './dotted-box.component.scss',
})
export class DottedBoxComponent {
  @Input({ required: true }) title: string;
  @Input() subtitle: string;
  @Input() subtitleColor: string = '#B5B5C3';
}

