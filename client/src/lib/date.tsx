export function toIsoDate(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function readableDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function monthLabel(cursor: Date) {
  return cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function getMonthDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const total = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: total }, (_, index) => {
    const currentDate = new Date(year, month, index + 1);
    return {
      iso: toIsoDate(currentDate),
      dayNumber: index + 1,
      weekday: currentDate.toLocaleDateString(undefined, { weekday: "short" }),
    };
  });
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}