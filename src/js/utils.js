
export const utils = {
  createDOMFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  },

  queryParams(params) {
    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  },

  numberToHour(number) {
    return (Math.floor(number) % 24) + ':' + (number % 1 * 60 + '').padStart(2, '0');
  },

  hourToNumber(hour) {
    const parts = hour.split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  },

  dateToStr(dateObj) {
    return dateObj.toISOString().slice(0, 10);
  },

  addDays(dateStr, days) {
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  },
};
