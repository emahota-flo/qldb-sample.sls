import { HttpBadRequestError } from '@errors/http';
import { errorHandler } from '@helper/error-handler';
import { log } from '@helper/logger';
import { APIGatewayLambdaEvent } from '@interfaces/api-gateway-lambda.interface';
import { AccountBalanceModel } from '@models/qldb/account-balances';
import { Handler } from 'aws-lambda';
import { AccountBalanceUpdateBody } from './account-balance.interface';

export const createAccountBalance: Handler<APIGatewayLambdaEvent<{ id: string }>> = async (event) => {
  log('createAccountBalance: ', event);
  try {
    const accountBalanceModel = new AccountBalanceModel();
    const { id } = event.body;

    return await accountBalanceModel.addItems([{ id: id, balance: 0 }]);
  } catch (e) {
    errorHandler(e);
  }
};

export const getAccountBalance: Handler<APIGatewayLambdaEvent<null, { id: string }>> = async (event) => {
  log('getAccountBalance: ', event);
  try {
    const accountBalanceModel = new AccountBalanceModel();
    const { id } = event.path;

    return await accountBalanceModel.getById(id);
  } catch (e) {
    errorHandler(e);
  }
};

export const updateAccountBalance: Handler<APIGatewayLambdaEvent<AccountBalanceUpdateBody, { id: string }>> = async (
  event
) => {
  log('updateAccountBalance: ', event);
  try {
    const accountBalanceModel = new AccountBalanceModel();
    const { id } = event.path;
    const { operationType, value } = event.body;

    const { balance } = await accountBalanceModel.getById(id);

    const newBalance = operationType === 'accrual' ? balance + value : balance - value;
    if (newBalance < 0) {
      throw new HttpBadRequestError(`The balance can't be less than 0!`);
    }

    return await accountBalanceModel.updateItemById(id, { balance: newBalance });
  } catch (e) {
    errorHandler(e);
  }
};
