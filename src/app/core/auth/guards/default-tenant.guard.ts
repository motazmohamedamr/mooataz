import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { of } from 'rxjs';
import { PATHS } from '@core/models';

export const canMatchWithDefaultTenant: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
) => {
  const returnUrl = segments.reduce(
    (path, currentSegment) => `${path}/${currentSegment.path}`,
    ''
  );

  const router = inject(Router);

  const isDefaultTenant =
    !environment.tenantIdentifier || environment.tenantIdentifier === 'default';

  if (isDefaultTenant) {
    return of(true);
  }

  router.navigate([PATHS.Page403]).then();

  return of(false);
};
