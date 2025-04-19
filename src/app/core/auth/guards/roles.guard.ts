import { Role } from '@core/api';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { IdentityManager } from '@core/auth';
import { map } from 'rxjs/operators';
import { PATHS } from '@core/models';
import { Observable } from 'rxjs';

export function canMatchWithRoles(roles: Role[]): CanMatchFn {
  return (route: Route, segments: UrlSegment[]): Observable<boolean> => {
    const returnUrl = segments.reduce(
      (path, currentSegment) => `${path}/${currentSegment.path}`,
      ''
    );

    const identityManager = inject(IdentityManager);
    const router = inject(Router);

    return identityManager.hasAnyRole(roles).pipe(
      map((authorized) => {
        if (!authorized) {
          router.navigate([PATHS.Page403]).then();
          return false;
        }

        return true;
      })
    );
  };
}
