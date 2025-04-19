export function getDateRange(range: 'today' | 'last7days' | 'last30days'): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);

  const from = new Date(now);

  switch (range) {
    case 'today':
      from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
      break;
    case 'last7days':
      from.setUTCDate(now.getUTCDate() - 6); // Subtract 6 days to get the start of the 7-day range
      from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
      break;
    case 'last30days':
      from.setUTCDate(now.getUTCDate() - 29); // Subtract 29 days to get the start of the 30-day range
      from.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
      break;
    default:
      throw new Error('Invalid range specified');
  }

  if (!(from instanceof Date) || !(to instanceof Date)) {
    return;
  }

  return {
    from: from,
    to: to,
  };
}
