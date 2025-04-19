import { Route, UrlSegment, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { IdentityManager } from '@core/auth';

export const userCanMatch: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const returnUrl = segments.reduce(
    (path, currentSegment) => `${path}/${currentSegment.path}`,
    ''
  );

  const identityManager = inject(IdentityManager);

  const user = identityManager.getUser();

  const authorized = !!user;

  if (!segments || !segments.length) return of(true);

  if (!authorized) {
    return identityManager.forceLogout(returnUrl);
  }

  return of(authorized);
};
