// Pika e vetme hyrese per metodat e pageses. Secili gateway eshte placeholder
// i dokumentuar - gati per t'u lidhur me sherbimin real pa prekur logjiken tjeter.
import * as sms from './sms.gateway.js';
import * as terminal from './terminal.gateway.js';
import { PAYMENT_METHOD } from '../config/constants.js';
import { bad } from '../utils/validators.js';

export async function chargeExternal(method, ctx) {
  if (method === PAYMENT_METHOD.SMS) return sms.charge(ctx);
  if (method === PAYMENT_METHOD.TERMINAL) return terminal.charge(ctx);
  throw bad('Metoda e pagesës nuk njihet.');
}
