class Booking {
  constructor(container) {
    const thisBooking = this;

    thisBooking.container = container;
    thisBooking.booked = {};

    thisBooking.render();
    thisBooking.getElements();
    thisBooking.initActions();
    thisBooking.getData();
    thisBooking.initTables();
  }

  render() {
    const thisBooking = this;

    const generatedHTML = `
      <div class="booking-wrapper">
        <h3>Wybierz datę i godzinę</h3>
        <input type="date" class="booking__date">
        <input type="time" class="booking__time">
        <h3>Wybierz stolik</h3>
        <div class="floor-plan">
          <div class="table" data-table="1">Stolik 1</div>
          <div class="table" data-table="2">Stolik 2</div>
          <div class="table" data-table="3">Stolik 3</div>
          <div class="table" data-table="4">Stolik 4</div>
        </div>
      </div>
    `;

    thisBooking.container.innerHTML = generatedHTML;
  }

  getElements() {
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = thisBooking.container;
    thisBooking.dom.dateInput = thisBooking.dom.wrapper.querySelector('.booking__date');
    thisBooking.dom.hourInput = thisBooking.dom.wrapper.querySelector('.booking__time');
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll('.table');
  }

  initActions() {
    const thisBooking = this;

    thisBooking.dom.dateInput.addEventListener('change', () => {
      thisBooking.updateDOM();
    });

    thisBooking.dom.hourInput.addEventListener('change', () => {
      thisBooking.updateDOM();
    });
  }

  getData() {
    const thisBooking = this;

    const today = new Date().toISOString().split('T')[0];
    thisBooking.booked[today] = {
      '12:00': [2], // zarezerwowany stolik 2
    };
  }

  updateDOM() {
    const thisBooking = this;

    const date = thisBooking.dom.dateInput.value;
    const hour = thisBooking.dom.hourInput.value;

    for (let table of thisBooking.dom.tables) {
      const tableId = parseInt(table.getAttribute('data-table'));

      if (
        thisBooking.booked[date] &&
        thisBooking.booked[date][hour] &&
        thisBooking.booked[date][hour].includes(tableId)
      ) {
        table.classList.add('booked');
        table.classList.remove('selected');
      } else {
        table.classList.remove('booked');
      }
    }
  }

  initTables() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        if (!table.classList.contains('booked')) {
          table.classList.toggle('selected');
        }
      });
    }
  }
}

export default Booking;
