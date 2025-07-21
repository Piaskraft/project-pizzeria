/* global Handlebars, utils */ // eslint-disable-line no-unused-vars

import Cart from './Cart.js';
import { settings, select, classNames, templates } from './settings.js';
import Booking from './Booking.js';
import AmountWidget from './AmountWidget.js';



'use strict';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }

  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(thisProduct.element);
  }

  getElements() {
    const thisProduct = this;
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
    const thisProduct = this;
    thisProduct.accordionTrigger.addEventListener('click', function (event) {
      event.preventDefault();
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      if (activeProduct && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm() {
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });
    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }
    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

 processOrder() {
  const thisProduct = this;
  const formData = utils.serializeFormToObject(thisProduct.form);
  let price = thisProduct.data.price;

  for (let paramId in thisProduct.data.params) {
    const param = thisProduct.data.params[paramId];

    for (let optionId in param.options) {
      const option = param.options[optionId];
      const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

      // Obliczanie ceny
      if (optionSelected && !option.default) {
        price += option.price;
      } else if (!optionSelected && option.default) {
        price -= option.price;
      }

      // Obsługa wielu obrazków danego składnika
      const imageSelector = '.' + paramId + '-' + optionId;
      const images = thisProduct.imageWrapper.querySelectorAll(imageSelector);

      for (let image of images) {
        if (optionSelected) {
          image.classList.add(classNames.menuProduct.imageVisible);
        } else {
          image.classList.remove(classNames.menuProduct.imageVisible);
        }
      }
    }
  }

  const pricePerSingle = price;
  price *= thisProduct.amountWidget.value;

  thisProduct.priceSingle = pricePerSingle;
  thisProduct.priceElem.innerHTML = '$' + price;
}


  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }

  prepareCartProduct() {
    const thisProduct = this;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams()
    };
    return productSummary;
  }

  prepareCartProductParams() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};
    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      params[paramId] = {
        label: param.label,
        options: {}
      };
      for (let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }

  addToCart() {
    const thisProduct = this;
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct()
      }
    });
    thisProduct.element.dispatchEvent(event);
  }
}



const app = {
  initPages: function () {
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    const idFromHash = window.location.hash.replace('#/', '');
    let pageMatchingHash = thisApp.pages[0].id;
    for (let page of thisApp.pages) {
      if (page.id === idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    thisApp.activatePage(pageMatchingHash);
    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const clickedElement = this;
        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);
        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function (pageId) {
    const thisApp = this;
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id === pageId);
    }
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') === '#' + pageId
      );
    }
  },

  initData: function () {
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;
    fetch(url)
      .then((rawResponse) => rawResponse.json())
      .then((parsedResponse) => {
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },

  initMenu: function () {
    const thisApp = this;
    for (let productData of thisApp.data.products) {
      new Product(productData.id, productData);
    }
  },

  initCart: function () {
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);
  },

  initBooking: function () {
    const thisApp = this;
    const bookingContainer = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingContainer);
  },

  init: function () {
    const thisApp = this;
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();

    const productList = document.querySelector(select.containerOf.menu);
    productList.addEventListener('add-to-cart', function (event) {
      thisApp.cart.add(event.detail.product);
    });
  }
};

app.init();
console.log('script.js działa ✅');
