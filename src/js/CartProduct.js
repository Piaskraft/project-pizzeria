import { select, settings } from './settings.js';

// KLASA CARTPRODUCT
class CartProduct {
    constructor(productData, domElement) {
        const thisCartProduct = this;

        thisCartProduct.id = productData.id;
        thisCartProduct.name = productData.name;
        thisCartProduct.amount = productData.amount;
        thisCartProduct.priceSingle = parseFloat(productData.priceSingle);

        thisCartProduct.price = productData.price;
        thisCartProduct.params = productData.params;

        thisCartProduct.dom = {};
        thisCartProduct.dom.wrapper = domElement;

        thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);

        thisCartProduct.initAmountWidget();
        thisCartProduct.initActions();

        console.log('✅ CartProduct utworzony:', thisCartProduct);
    }

    initActions() {
        const thisCartProduct = this;

        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);

        thisCartProduct.dom.remove.addEventListener('click', function (event) {
            event.preventDefault();

            const removeEvent = new CustomEvent('remove', {
                bubbles: true,
                detail: {
                    cartProduct: thisCartProduct,
                },
            });

            thisCartProduct.dom.wrapper.dispatchEvent(removeEvent);
        });
    }

    initAmountWidget() {
        const thisCartProduct = this;

        thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
        thisCartProduct.amountWidget.setValue(thisCartProduct.amount);

        thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
            thisCartProduct.amount = thisCartProduct.amountWidget.value;
            thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
            thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
        });
    }
}

// KLASA AMOUNTWIDGET
class AmountWidget {
    constructor(element) {
        const thisWidget = this;

        thisWidget.getElements(element);
        thisWidget.value = settings.amountWidget.defaultValue;
        thisWidget.setValue(thisWidget.input.value);
        thisWidget.initActions();
    }

    getElements(element) {
        const thisWidget = this;

        thisWidget.element = element;
        thisWidget.input = thisWidget.element.querySelector('input');
        thisWidget.linkDecrease = thisWidget.element.querySelector('a[href="#less"]');
        thisWidget.linkIncrease = thisWidget.element.querySelector('a[href="#more"]');
    }

    setValue(value) {
        const thisWidget = this;

        const newValue = parseInt(value);

        if (
            thisWidget.value !== newValue &&
            !isNaN(newValue) &&
            newValue >= settings.amountWidget.defaultMin &&
            newValue <= settings.amountWidget.defaultMax
        ) {
            thisWidget.value = newValue;
            thisWidget.announce();
        }

        thisWidget.input.value = thisWidget.value;
    }

    initActions() {
        const thisWidget = this;

        thisWidget.input.addEventListener('change', function () {
            thisWidget.setValue(thisWidget.input.value);
        });

        thisWidget.linkDecrease.addEventListener('click', function (event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value - 1);
        });

        thisWidget.linkIncrease.addEventListener('click', function (event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value + 1);
        });
    }

    announce() {
        const thisWidget = this;

        const event = new CustomEvent('updated', {
            bubbles: true,
        });

        thisWidget.element.dispatchEvent(event);
    }
}

export default CartProduct;
