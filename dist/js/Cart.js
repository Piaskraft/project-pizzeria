import { select, templates, settings } from './settings.js';

import CartProduct from './CartProduct.js';

import { utils } from './utils.js';







class Cart {
    constructor(element) {
        const thisCart = this;

        thisCart.products = [];
        thisCart.dom = {};
        thisCart.dom.wrapper = element;

        thisCart.getElements();
        thisCart.dom.toggleTrigger.addEventListener('click', function () {
            thisCart.dom.wrapper.classList.toggle('active');
        });
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
        });


        thisCart.dom.wrapper.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct);
        });



        console.log('Koszyk został uruchomiony', thisCart);
    }

    update() {
        const thisCart = this;

        let totalNumber = 0;
        let subtotalPrice = 0;

        for (let cartProduct of thisCart.products) {
            totalNumber += cartProduct.amount;
            subtotalPrice += cartProduct.price;
        }

        const deliveryFee = totalNumber > 0 ? settings.cart.defaultDeliveryFee : 0;
        const totalPrice = subtotalPrice + deliveryFee;

        thisCart.totalNumber = totalNumber;
        thisCart.subtotalPrice = subtotalPrice;
        thisCart.totalPrice = totalPrice;
        thisCart.deliveryFee = deliveryFee;


    }
    sendOrder() {
        const thisCart = this;

        const payload = {
            phone: thisCart.dom.phone.value,
            address: thisCart.dom.address.value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.subtotalPrice,
            totalNumber: thisCart.totalNumber,
            deliveryFee: thisCart.deliveryFee,
            products: [],
        };

        for (let product of thisCart.products) {
            payload.products.push(product.getData());
        }

        fetch('https://httpbin.org/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (parsedResponse) {
                console.log('Odpowiedź z serwera:', parsedResponse);
            });


    }


    getElements() {
        const thisCart = this;

        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
        thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);



    }
    remove(cartProduct) {
        const thisCart = this;

        // znajdź index produktu w tablicy
        const index = thisCart.products.indexOf(cartProduct);

        // usuń z tablicy
        thisCart.products.splice(index, 1);

        // usuń z DOM
        cartProduct.dom.wrapper.remove();

        // przelicz wartości
        thisCart.update();
    }



    add(product) {
        const thisCart = this;

        // generuj HTML na podstawie szablonu
        const generatedHTML = templates.cartProduct(product);

        // zamień HTML string na element DOM
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        // wstaw do listy produktów w koszyku
        thisCart.dom.productList.appendChild(generatedDOM);

        // stwórz instancję CartProduct i zapisz ją
        const productData = {
            id: product.id,
            name: product.name,
            amount: product.amount,
            priceSingle: product.priceSingle,
            price: product.price,
            params: product.params,
        };



        const cartProduct = new CartProduct(productData, generatedDOM);

        thisCart.products.push(cartProduct);

        console.log('🧱 Dodano CartProduct do koszyka:', cartProduct);

        thisCart.update();

    }


}

export default Cart;
