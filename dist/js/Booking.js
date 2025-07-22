


import AmountWidget from './AmountWidget.js';
import { select, templates, settings, classNames } from './settings.js';
import { utils } from './utils.js';
import DatePicker from './components/DatePicker.js';
import HourPicker from './components/HourPicker.js';



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

    console.log('📦 Stoliki złapane przez JS:');
    thisBooking.dom.tables.forEach(table => {
      console.log('👉', table.getAttribute('data-table'));
    });


  }



  initWidgets() {
    const thisBooking = this;

    thisBooking.datePicker = new DatePicker(thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper));
    thisBooking.hourPicker = new HourPicker(
      thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper)
    );



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

    thisBooking.dom.wrapper
      .querySelector('.booking-form')
      .addEventListener('submit', function (event) {
        event.preventDefault();
        thisBooking.sendBooking();
      });
    thisBooking.datePicker.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.hourPicker.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
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
      // Tworzymy obiekt dla konkretnej daty, jeśli nie istnieje
      if (typeof thisBooking.booked[date] === 'undefined') {
        thisBooking.booked[date] = {};
      }

      // Konwertujemy godzinę np. "17:30" → 17.5
      const startHour = utils.hourToNumber(hour);

      // Zaznaczamy każdy 30-minutowy blok jako zajęty
      for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
        if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
          thisBooking.booked[date][hourBlock] = [];
        }

        thisBooking.booked[date][hourBlock].push(parseInt(table));


        // Logujemy każdy wpis — przydatne do debugowania
        console.log(
          `📅 Rezerwacja: ${date}, godzina: ${hourBlock}, stolik: ${table}`
        );
      }
    };

    // Przetwarzamy rezerwacje jednorazowe
    for (let item of bookings) {
      makeBooked(item.date, item.hour, item.duration, item.table);
    }

    // Przetwarzamy aktualne eventy
    for (let item of eventsCurrent) {
      makeBooked(item.date, item.hour, item.duration, item.table);
    }

    // Przetwarzamy powtarzające się eventy (np. codziennie)
    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let i = 0; i < 14; i++) {
          const date = utils.dateToStr(utils.addDays(new Date(), i));
          makeBooked(date, item.hour, item.duration, item.table);
        }
      }
    }

    // Odświeżamy interfejs, żeby pokazać aktualny stan stolików
    thisBooking.updateDOM();
  }


  updateDOM() {
    const thisBooking = this;

    const date = thisBooking.datePicker.value;

    const hour = typeof thisBooking.hourPicker.value === 'string'
      ? utils.hourToNumber(thisBooking.hourPicker.value)
      : thisBooking.hourPicker.value;

    console.log('Zarejestrowane stoliki:');
    for (let table of thisBooking.dom.tables) {
      const tableId = table.getAttribute(settings.booking.tableIdAttribute);
      console.log('🪑 stolik ma data-table =', tableId);
    }



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
        console.log('🧪 Kliknięto stolik:', table);

        if (!table.classList.contains(classNames.booking.tableBooked)) {
          table.classList.toggle('selected');
          console.log('🟢 Zaznaczono stolik:', table.getAttribute('data-table'));
        } else {
          console.log('🔒 Stolik zablokowany:', table.getAttribute('data-table'));
        }
      });
    }
  }
  sendBooking() {
    const thisBooking = this;

    const date = thisBooking.datePicker.value;
    const hourNumber = thisBooking.hourPicker.value;
    const hour = `${Math.floor(hourNumber)}:${hourNumber % 1 === 0.5 ? '30' : '00'}`;


    if (!date || !hour) {
      alert('Uzupełnij datę i godzinę przed rezerwacją!');
      return;
    }

    const selectedTable = thisBooking.dom.wrapper.querySelector('[data-table].selected');

    if (!selectedTable) {
      alert('Zaznacz stolik przed rezerwacją!');
      return;
    }

    const payload = {
      date,
      hour,
      table: parseInt(selectedTable.getAttribute(settings.booking.tableIdAttribute)),
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters: [],
      phone:thisBooking.dom.wrapper.querySelector('[name="phone"]').value.trim() || 'brak-telefonu',
      address:thisBooking.dom.wrapper.querySelector('[name="address"]').value.trim() || 'brak-adresu',
       id: Date.now(),
    }


    const starters = thisBooking.dom.wrapper.querySelectorAll('[name="starter"]:checked');
    for (let starter of starters) {
      payload.starters.push(starter.value);
    }

    console.log('✅ Wysyłam payload:', payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    console.log('🛠 Payload JSON:', JSON.stringify(payload));


    fetch(`${settings.db.url}/${settings.db.bookings}`, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Błąd serwera: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        console.log('✅ Rezerwacja wysłana:', payload);
        thisBooking.getData(); // odświeżenie dostępności stolików
      })
      .catch((error) => {
        console.error('❌ Błąd podczas rezerwacji:', error.message);
        alert('Wystąpił błąd podczas rezerwacji. Spróbuj ponownie później.');
      });
  }




}

export default Booking;
