import { Router, Route, UrlSegment, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { IdentityManager } from '@core/auth';
import { from, of } from 'rxjs';
import {PATHS} from "@core/models";

export const noUserCanMatch: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const identityManager = inject(IdentityManager);

  const user = identityManager.getUser();

  const authorized = !!user;

  if (authorized) {
    return from(
      inject(Router)
        .navigate([PATHS.Home])
        .then(() => true)
    );
  }

  return of(!authorized);
};
