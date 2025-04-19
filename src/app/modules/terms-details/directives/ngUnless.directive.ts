import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[ngUnless]',
})
export class NgUnlessDirective {
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _templateRef = inject(TemplateRef);

  @Input()
  set ngUnless(condition: boolean) {
    if (!condition) {
      this._viewContainerRef.createEmbeddedView(this._templateRef);
    } else {
      this._viewContainerRef.clear();
    }
  }
}
