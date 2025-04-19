import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fullDate' })
export class FullDatePipe implements PipeTransform {
  private monthNames: Record<string, string[]> = {
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    ar: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
  };

  transform(value: Date, lang: string = 'en'): string {
    const monthIndex = value.getMonth();
    return `${value.getDate()} ${
      this.monthNames[lang][monthIndex]
    } ${value.getFullYear()}`;
  }
}
