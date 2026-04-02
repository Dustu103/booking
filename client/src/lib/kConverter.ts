/**
 * Converts a number to a string with "K" suffix if it's over 1000.
 * @param num - The number to convert.
 * @returns Formatted number string or the original number if less than 1000.
 */
export const kConverter = (num: number): string | number => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num;
  }
};
