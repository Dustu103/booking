/**
 * Formats a duration in minutes into a string with hours and remaining minutes.
 * @param minutes - Total duration in minutes.
 * @returns Formatted string (e.g., "1h 42m").
 */
const timeFormat = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const minutesRemainder = minutes % 60;
  return `${hours}h ${minutesRemainder}m`;
};

export default timeFormat;
