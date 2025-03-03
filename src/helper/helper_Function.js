export const formatDateRange = (startDate, endDate) => {
  const options = { month: "short", day: "numeric", year: "numeric" };
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formattedStart = new Intl.DateTimeFormat("en-US", options).format(
    start
  );
  const formattedEnd = new Intl.DateTimeFormat("en-US", options).format(end);

  return `${formattedStart} - ${formattedEnd}`;
};

export const formatTimeRange = (startDate, endDate) => {
  const options = { hour: "2-digit", minute: "2-digit", hour12: true };
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formattedStart = new Intl.DateTimeFormat("en-US", options).format(
    start
  );
  const formattedEnd = new Intl.DateTimeFormat("en-US", options).format(end);

  return `${formattedStart} - ${formattedEnd}`;
};

export const formatEventDateTime = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return "Date Not Available";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if the event starts and ends on the same day
  if (start.toDateString() === end.toDateString()) {
    const dateOptions = { day: "numeric", month: "short", year: "numeric" };
    const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
      start
    );
    const timeRange = formatTimeRange(startDate, endDate);
    return `${formattedDate} | ${timeRange}`;
  } else {
    return formatDateRange(startDate, endDate);
  }
};
