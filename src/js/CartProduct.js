

import { select } from './settings.js';

class CartProduct {
    constructor(productData, domElement) {
        const thisCartProduct = this;

        thisCartProduct.id = productData.id;
        thisCartProduct.name = productData.name;
        thisCartProduct.amount = productData.amount;
        thisCartProduct.priceSingle = productData.priceSingle;
        thisCartProduct.price = productData.price;
        thisCartProduct.params = productData.params;

        thisCartProduct.dom = {};
        thisCartProduct.dom.wrapper = domElement;

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
      
}export default CartProduct;


   