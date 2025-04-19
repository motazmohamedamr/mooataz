import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export function gregorianToHijri(date: Date): NgbDateStruct {
  let myFormat = 'en-u-ca-islamic-umalqura-nu-latn';

  let year = new Intl.DateTimeFormat(myFormat, { year: 'numeric' }).format(date);
  let month = new Intl.DateTimeFormat(myFormat, { month: 'numeric' }).format(date);
  let day = new Intl.DateTimeFormat(myFormat, { day: 'numeric' }).format(date);

  return { year: +year.split(' ')[0], month: +month, day: +day };
}
