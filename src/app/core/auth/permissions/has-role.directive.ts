import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Role } from '@core/api';
import { BehaviorSubject, mergeMap, Observable, of } from 'rxjs';
import { IdentityManager } from '@core/auth';

@Directive({
  selector: '[hasRole], [hasRoleIsAdmin]',
})
export class HasRoleDirective {
  private identityManager = inject(IdentityManager);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private show = new BehaviorSubject<Observable<boolean | undefined>>(of(undefined));

  @Input('hasRole') set role(role: Role | Role[] | undefined) {
    if (role !== undefined) {
      this.show.next(this.identityManager.hasAnyRole(role));
    }
  }

  @Input('hasRoleIsAdmin') set isAdmin(isAdmin: boolean) {
    if (isAdmin) {
      this.show.next(this.identityManager.hasAnyRole(Role.Admin));
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
