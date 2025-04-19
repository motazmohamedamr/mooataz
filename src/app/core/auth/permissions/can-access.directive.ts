import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, mergeMap, Observable, of } from 'rxjs';
import { IdentityManager } from '@core/auth';

@Directive({
  selector: '[canAccess]',
})
export class CanAccessDirective {
  private identityManager = inject(IdentityManager);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private show = new BehaviorSubject<Observable<boolean | undefined>>(of(undefined));

  @Input('canAccess') set module(module: string | string[] | undefined) {
    if (module) {
      this.show.next(this.identityManager.canAccess(module));
    }
  }

  ngOnInit(): void {
    this.show.pipe(mergeMap((s) => s)).subscribe((showTemplate) => {
      return showTemplate ? this.addTemplate() : this.clearTemplate();
    });
  }

  private addTemplate() {
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef);
  }

  private clearTemplate() {
    this.viewContainer.clear();
  }
}
