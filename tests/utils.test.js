describe('getYesterdayDateString', () => {
  test('returns previous day in YYYY-MM-DD format', () => {
    expect(getYesterdayDateString('2026-07-18')).toBe('2026-07-17');
  });

  test('handles month boundary', () => {
    expect(getYesterdayDateString('2026-03-01')).toBe('2026-02-28');
  });

  test('handles year boundary', () => {
    expect(getYesterdayDateString('2026-01-01')).toBe('2025-12-31');
  });
});

describe('getWeekID', () => {
  test('returns ISO week string', () => {
    const result = getWeekID('2026-07-18');
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('getWeekStartDate', () => {
  test('returns Monday of given week', () => {
    const result = getWeekStartDate('2026-W29');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getWeekDates', () => {
  test('returns 7 dates starting from Monday', () => {
    const dates = getWeekDates('2026-07-18');
    expect(dates).toHaveLength(7);
    dates.forEach(d => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });
});

describe('formatDateLabelShort', () => {
  test('formats date as Mon D', () => {
    expect(formatDateLabelShort('2026-07-18')).toBe('Jul 18');
  });
});

describe('calculateDaysRemaining', () => {
  test('returns days left for future date', () => {
    const result = calculateDaysRemaining('2026-12-25');
    expect(result).toMatch(/\d+d left/);
  });

  test('returns overdue for past date', () => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 5);
    const pastStr = past.toISOString().split('T')[0];
    const result = calculateDaysRemaining(pastStr);
    expect(result).toMatch(/Overdue by \d+d/);
  });

  test('returns deadline today when date is today', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    expect(calculateDaysRemaining(todayStr)).toBe('Deadline today');
  });

  test('returns empty string for no deadline', () => {
    expect(calculateDaysRemaining('')).toBe('');
  });
});

describe('isBlockCompleted', () => {
  const checkboxBlock = {
    fields: [{ type: 'checkbox' }, { type: 'text' }]
  };
  const numberBlock = {
    fields: [{ type: 'number', id: 'minutes' }]
  };

  test('returns true for checked checkbox', () => {
    expect(isBlockCompleted(checkboxBlock, { completed: true })).toBe(true);
  });

  test('returns false for unchecked checkbox', () => {
    expect(isBlockCompleted(checkboxBlock, { completed: false })).toBe(false);
  });

  test('returns true for number field with value > 0', () => {
    expect(isBlockCompleted(numberBlock, { minutes: 30 })).toBe(true);
  });

  test('returns false for number field with value 0', () => {
    expect(isBlockCompleted(numberBlock, { minutes: 0 })).toBe(false);
  });

  test('returns false for null/undefined log', () => {
    expect(isBlockCompleted(checkboxBlock, null)).toBe(false);
    expect(isBlockCompleted(checkboxBlock, undefined)).toBe(false);
  });
});

describe('getBlockStreak', () => {
  beforeEach(() => {
    appState.logs = {};
    appState.settings.scheduleBlocks = [
      { id: 'gym', fields: [{ type: 'checkbox' }], time: 'Flexible' }
    ];
  });

  test('returns 0 when no logs exist', () => {
    expect(getBlockStreak('gym')).toBe(0);
  });
});

describe('calculateWeeklyScore', () => {
  test('returns 0 when no linked blocks', () => {
    appState.goals.linkedHabits = [];
    appState.settings.scheduleBlocks = [];
    expect(calculateWeeklyScore('2026-W29')).toBe(0);
  });
});
