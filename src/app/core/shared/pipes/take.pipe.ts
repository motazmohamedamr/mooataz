import { Pipe, PipeTransform } from '@angular/core';

export const take = (str: string, num: number): string => {
  if (!str) {
    return '';
  }
  const txt = str.replace(/(\r\n|\n|\r)/gm, ' ').trim();
  return txt.length > num ? `${txt.substring(0, num)} ...` : txt;
};

@Pipe({ name: 'take' })
export class TakePipe implements PipeTransform {
  transform(str: string, num: number): string {
    return take(str, num);
  }
}
