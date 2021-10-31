import { getEnv } from '@helper/environment';
import { log } from '@helper/logger';
import { QLDBInitService } from '@services/qldb-init.service';
import { Handler } from 'aws-lambda';
import * as response from 'cfn-response-promise';

export const createQLDBTables: Handler = async (event, context) => {
  log('createQLDBTables', event);
  try {
    const { RequestType } = event;

    const qldbInitService = new QLDBInitService(getEnv('QLDB_LEDGER_NAME'));
    const accountBalancesTableName = getEnv('QLDB_ACCOUNT_BALANCE_TABLE_NAME');

    if (RequestType === 'Create') {
      await qldbInitService.createTable(accountBalancesTableName);
    }

    await response.send(event, context, response.SUCCESS, { requestType: RequestType });
  } catch (error) {
    log(error);
    await response.send(event, context, response.FAILED);
  }
};
