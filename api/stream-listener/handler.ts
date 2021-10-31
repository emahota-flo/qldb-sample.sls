import { log } from '@helper/logger';
import { AccountBalanceModel } from '@models/QLDB/account-balance';
import { Handler } from 'aws-lambda';
import * as ion from 'ion-js';
import * as lambda from 'aws-lambda';

export const streamListener: Handler = async (event) => {
  log('streamListener: ', event);

  for (const record of event.Records) {
    try {
      const payload: lambda.KinesisStreamRecordPayload = record.kinesis;
      const ionRecord: any = ion.load(Buffer.from(payload.data, 'base64'));
      log('ionRecord', ionRecord);

      const requestStr = getQldbRequest(ionRecord);
      if (requestStr && requestStr === 'UPDATE AccountBalance as item SET item.balance = ? WHERE item.id = ?') {
        const documentId = ionRecord['payload']['revisionSummaries'][0]['documentId'];
        log('documentId', documentId);

        const accountBalanceModel = new AccountBalanceModel();
        const item = await accountBalanceModel.getByDocumentId(documentId);

        log('accountBalance: ', item);
      }
    } catch (error) {
      log('Error: ', error);
    }
  }
};

function getQldbRequest(ionRecord: any): string {
  let statementString;
  const partiqlStatements = ionRecord.get('payload', 'transactionInfo', 'statements');
  for (const statementElement of partiqlStatements!.elements()) {
    statementString = statementElement.get('statement')?.stringValue();
    if (statementString!.toLowerCase().startsWith('select')) {
      continue;
    }
  }

  log('statementString', statementString);

  return statementString;
}