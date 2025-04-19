import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string, locale: string = 'en'): string {
    if (!value) return '';

    try {
      const date = new Date(value);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period =
        hours >= 12
          ? locale === 'ar'
            ? 'مساءً'
            : 'PM'
          : locale === 'ar'
          ? 'صباحًا'
          : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 24h to 12h format
      const formattedMinutes = minutes.toString().padStart(2, '0');

      return `${formattedHours}:${formattedMinutes} ${period}`;
    } catch (error) {
      console.error('Invalid date format:', value);
      return '';
    }
  }
}
