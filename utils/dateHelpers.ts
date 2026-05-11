/**
 * Utility functions for date formatting and manipulation in the mobile app.
 */

/**
 * Returns the start and end dates of the current month in 'YYYY-MM-DD' format.
 * @returns { from: string, to: string }
 */
export const getCurrentMonthDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(firstDay),
    to: formatDate(lastDay)
  };
};

/**
 * Formats a date string to a user-friendly format (e.g., "14 Mar 2026").
 * @param dateStr The date string to format
 * @returns Formatted date string
 */
export const formatDisplayDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};
