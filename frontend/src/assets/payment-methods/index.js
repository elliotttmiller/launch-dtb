import affirmLogo from './affirm.svg';
import afterpayLogo from './afterpay.svg';
import americanExpressLogo from './american-express.svg';
import applePayLogo from './apple-pay.svg';
import googlePayLogo from './google-pay.svg';
import klarnaLogo from './klarna.svg';
import mastercardLogo from './mastercard.svg';
import paypalLogo from './paypal.svg';
import visaLogo from './visa.svg';

export const PAYMENT_CARD_NETWORK_ASSETS = Object.freeze({
  americanExpress: Object.freeze({
    id: 'american-express',
    label: 'American Express',
    src: americanExpressLogo,
  }),
  mastercard: Object.freeze({
    id: 'mastercard',
    label: 'Mastercard',
    src: mastercardLogo,
  }),
  visa: Object.freeze({
    id: 'visa',
    label: 'Visa',
    src: visaLogo,
  }),
});

export const EXPRESS_CHECKOUT_METHODS = Object.freeze([
  {
    readinessKey: 'applePay',
    id: 'apple-pay',
    label: 'Apple Pay',
    src: applePayLogo,
    framed: true,
  },
  {
    readinessKey: 'googlePay',
    id: 'google-pay',
    label: 'Google Pay',
    src: googlePayLogo,
  },
  {
    readinessKey: 'klarna',
    id: 'klarna',
    label: 'Klarna',
    src: klarnaLogo,
    framed: true,
  },
  {
    readinessKey: 'affirm',
    id: 'affirm',
    label: 'Affirm',
    src: affirmLogo,
  },
  {
    readinessKey: 'paypal',
    id: 'paypal',
    label: 'PayPal',
    src: paypalLogo,
  },
  {
    readinessKey: 'afterpay',
    id: 'afterpay',
    label: 'Afterpay',
    src: afterpayLogo,
    framed: true,
  },
]);
