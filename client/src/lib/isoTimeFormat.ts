/**
 * Formats an ISO date string into a localized time string (e.g., "02:30 PM").
 * @param dateTime - ISO date string or Date object.
 * @returns Formatted time string.
 */
const isoTimeFormat = (dateTime: string | Date): string => {
  const date = new Date(dateTime);
  const localTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return localTime;
};

export default isoTimeFormat;
