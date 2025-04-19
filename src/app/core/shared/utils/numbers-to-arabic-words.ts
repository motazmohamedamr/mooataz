const units = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
];
const tens = [
  '',
  'عشرة',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
];
const teens = [
  '',
  'إحدى عشر',
  'إثنى عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];
const hundreds = [
  '',
  'مئة',
  'مئتان',
  'ثلاثمئة',
  'أربعمئة',
  'خمسمئة',
  'ستمئة',
  'سبعمئة',
  'ثمانمئة',
  'تسعمئة',
];

export function numberToArabicWords(number: number) {
  let roundedNumber = parseFloat(number.toString()).toFixed(2);
  let [integerPart, fractionPart] = roundedNumber.split('.');

  let integerWords = convertIntegerToArabic(parseInt(integerPart));

  let result = integerWords ? `${integerWords} ريالا` : 'صفر ريالا';

  if (fractionPart && parseInt(fractionPart) !== 0) {
    let fractionWords = convertIntegerToArabic(parseInt(fractionPart));
    result += ` و${fractionWords} هلله`;
  }

  return result;
}

function convertIntegerToArabic(num: number): string {
  if (num === 0) return '';
  let words = [];

  if (num >= 1000) {
    let thousands = Math.floor(num / 1000);
    words.push(convertIntegerToArabic(thousands) + ' ألفا');
    num %= 1000;
  }

  if (num >= 100) {
    let hundredsPart = Math.floor(num / 100);
    words.push(hundreds[hundredsPart]);
    num %= 100;
  }

  if (num >= 20) {
    let unitsPart = num % 10;
    let tensPart = Math.floor(num / 10);

    if (unitsPart > 0) {
      words.push(units[unitsPart] + ' و' + tens[tensPart]);
    } else {
      words.push(tens[tensPart]);
    }
  } else if (num >= 11 && num <= 19) {
    words.push(teens[num - 10]);
  } else if (num > 0) {
    words.push(units[num]);
  }

  return words.join(' و');
}
