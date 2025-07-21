import BaseWidget from './BaseWidget.js';
import { select, settings } from '../settings.js';

class HourPicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, settings.hours.open);

    const thisWidget = this;

    thisWidget.dom.wrapper = wrapper;

    thisWidget.getElements();
    thisWidget.initPlugin();
    thisWidget.renderValue();
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.output);
  }

  initPlugin() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('input', function () {
      thisWidget.value = thisWidget.dom.input.value;
    });
  }

  renderValue() {
    const thisWidget = this;

    if (thisWidget.dom.output) {
      thisWidget.dom.output.innerHTML = thisWidget.value;
    }
  }
}

export default HourPicker;
