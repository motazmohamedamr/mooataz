import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export function hijriToGregorian(hijriDate: NgbDateStruct): NgbDateStruct {
  const hijriYear = hijriDate.year;
  const hijriMonth = hijriDate.month;
  const hijriDay = hijriDate.day;

  const jd =
    Math.floor((11 * hijriYear + 3) / 30) +
    354 * hijriYear +
    30 * hijriMonth -
    Math.floor((hijriMonth - 1) / 2) +
    hijriDay +
    1948440 -
    385;

  let l = jd + 68569;
  let n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  let i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 29;
  let j = Math.floor((80 * l) / 2447);
  let day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  let month = j + 2 - 12 * l;
  let year = 100 * (n - 49) + i + l;

  return { year, month, day };
}
