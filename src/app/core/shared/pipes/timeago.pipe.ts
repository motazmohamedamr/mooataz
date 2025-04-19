import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date): string {
    if (!value) return '';

    const now = new Date();
    const targetDate = new Date(value);
    const diff = targetDate.getTime() - now.getTime();

    if (isNaN(diff)) return '';

    // Convert milliseconds to seconds
    const diffSeconds = Math.abs(Math.floor(diff / 1000));

    // Calculate weeks, days, hours, and minutes
    const weeks = Math.floor(diffSeconds / (7 * 24 * 60 * 60));
    const days = Math.floor((diffSeconds % (7 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);

    // Build the output string
    if (weeks > 0) return `${weeks}w`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'now';
  }
}
