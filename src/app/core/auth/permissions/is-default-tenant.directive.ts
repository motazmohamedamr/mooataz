import {Directive, inject, TemplateRef, ViewContainerRef} from '@angular/core';
import {environment} from '@env/environment';

@Directive({
  selector: '[isDefaultTenant]',
})
export class IsDefaultTenantDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    const isDefaultTenant =
      !environment.tenantIdentifier || environment.tenantIdentifier === 'default';

    if (isDefaultTenant) {
      this.addTemplate();
    } else {
      this.clearTemplate();
    }
  }

  private addTemplate() {
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef);
  }

  private clearTemplate() {
    this.viewContainer.clear();
  }
}
