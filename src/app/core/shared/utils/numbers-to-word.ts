export function numberToWords(num: number) {
  if (num === 0) return 'zero';

  const belowTwenty = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  const thousands = ['', 'thousand', 'million', 'billion'];

  function helper(num: number): any {
    if (num === 0) return '';
    else if (num < 20) return belowTwenty[num] + ' ';
    else if (num < 100) return tens[Math.floor(num / 10)] + ' ' + helper(num % 10);
    else return belowTwenty[Math.floor(num / 100)] + ' hundred ' + helper(num % 100);
  }

  function convertIntegerPart(num: number) {
    let index = 0;
    let words = '';

    while (num > 0) {
      if (num % 1000 !== 0) {
        words = helper(num % 1000) + thousands[index] + ' ' + words;
      }
      num = Math.floor(num / 1000);
      index++;
    }

    return words.trim();
  }

  function convertDecimalPart(num: number) {
    const decimalStr = num.toString().split('.')[1];
    let words = 'point';

    for (const digit of decimalStr) {
      words += ' ' + belowTwenty[Number(digit)];
    }

    return words;
  }

  const parts = num.toString().split('.');
  const integerPart = Number(parts[0]);
  const decimalPart = parts[1] ? Number('0.' + parts[1]) : 0;

  let result = convertIntegerPart(integerPart);

  if (decimalPart > 0) {
    result += ' ' + convertDecimalPart(decimalPart);
  }

  return result.trim();
}
