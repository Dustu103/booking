/**
 * Formats a date string into a readable format for show schedules.
 * @param date - ISO date string or Date object.
 * @returns Formatted date/time string.
 */
export const dateFormat = (date: string | Date): string => {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};
