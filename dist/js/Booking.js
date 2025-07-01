/* global flatpickr */


import AmountWidget from './AmountWidget.js';
import { select, templates, settings, classNames } from './settings.js';
import { utils } from './utils.js';

class Booking {
  constructor(container) {
    const thisBooking = this;

    thisBooking.container = container;
    thisBooking.booked = {};

    thisBooking.render(container);
    thisBooking.getElements();
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initTables();
  }

  render(container) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = container;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
  }

  getElements() {
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = thisBooking.container;
    thisBooking.dom.dateInput = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisBooking.dom.hourInput = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisBooking.dom.hourOutput = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.output);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.hourDisplay = thisBooking.dom.wrapper.querySelector('.booking__hour-value');
  }
 

  initWidgets() {
    const thisBooking = this;
    flatpickr(thisBooking.dom.dateInput, {
  defaultDate: new Date(),
  minDate: new Date(),
  dateFormat: 'd/m/Y',
  disableMobile: true,
});


    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.dom.peopleAmount.addEventListener('updated', function () {
      thisBooking.valuePeople = thisBooking.peopleAmountWidget.value;
      thisBooking.updateDOM();
    });

    thisBooking.dom.hoursAmount.addEventListener('updated', function () {
      thisBooking.valueHours = thisBooking.hoursAmountWidget.value;
      thisBooking.updateDOM();
    });

    thisBooking.dom.hourInput.addEventListener('input', function () {
      thisBooking.updateHour();
    });
  }

  updateHour() {
    const thisBooking = this;
    const hour = parseFloat(thisBooking.dom.hourInput.value);
    thisBooking.hour = hour;

    const hourFormatted = `${Math.floor(hour)}:${hour % 1 === 0.5 ? '30' : '00'}`;
    thisBooking.dom.hourDisplay.innerText = hourFormatted;

    thisBooking.updateDOM();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(new Date());
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(utils.addDays(new Date(), 14));

    const params = {
      bookings: [startDateParam, endDateParam],
      eventsCurrent: [startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam],
    };

    const urls = {
      bookings: settings.db.url + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        return Promise.all(allResponses.map(function (response) {
          return response.json();
        }));
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    const makeBooked = function (date, hour, duration, table) {
      if (typeof thisBooking.booked[date] == 'undefined') {
        thisBooking.booked[date] = {};
      }

      const startHour = utils.hourToNumber(hour);

      for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
        if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
          thisBooking.booked[date][hourBlock] = [];
        }

        thisBooking.booked[date][hourBlock].push(table);
      }
    };

    for (let item of bookings) {
      makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let i = 0; i < 14; i++) {
          const date = utils.dateToStr(utils.addDays(new Date(), i));
          makeBooked(date, item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }

  updateDOM() {
    const thisBooking = this;

    const date = thisBooking.dom.dateInput.value;
    const hour = utils.hourToNumber(thisBooking.dom.hourInput.value);

    for (let table of thisBooking.dom.tables) {
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

      if (
        thisBooking.booked[date] &&
        thisBooking.booked[date][hour] &&
        thisBooking.booked[date][hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove('selected');
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        if (!table.classList.contains(classNames.booking.tableBooked)) {
          table.classList.toggle('selected');
        }
      });
    }
  }
}

export default Booking;
