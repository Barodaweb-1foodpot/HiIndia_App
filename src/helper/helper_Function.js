 export const formatDateRange = (startDate, endDate) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formattedStart = new Intl.DateTimeFormat("en-US", options).format(start);
    const formattedEnd = new Intl.DateTimeFormat("en-US", options).format(end);
    
    return `${formattedStart} - ${formattedEnd}`;
  };

export  const formatTimeRange = (startDate, endDate) => {
    const options = { hour: "2-digit", minute: "2-digit", hour12: true };
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formattedStart = new Intl.DateTimeFormat("en-US", options).format(start);
    const formattedEnd = new Intl.DateTimeFormat("en-US", options).format(end);

    return `${formattedStart} - ${formattedEnd}`;
  };