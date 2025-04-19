import { Pipe, PipeTransform } from '@angular/core';
import { Params, Router } from '@angular/router';

export const parseUrl = (
  url: string,
  router: Router
): { params: Params; link: string } => {
  const urlTree = router.parseUrl(url);
  const params = urlTree.queryParams;

  const link = urlTree.root.children['primary'].segments.reduce(
    (prev, curr) => prev + '/' + curr,
    '/'
  );

  return { params, link };
};

@Pipe({ name: 'parseUrl' })
export class ParseUrlPipe implements PipeTransform {
  constructor(private _router: Router) {}

  transform = (url: string): { params: Params; link: string } =>
    parseUrl(url, this._router);
}
