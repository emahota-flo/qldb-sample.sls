import { getEnv } from '@helper/environment';
import { QLDBGeneralInterface, QLDBModel } from '@services/qldb.service';

export interface AccountBalance extends QLDBGeneralInterface {
  balance: number;
}

export class AccountBalanceModel extends QLDBModel<AccountBalance> {
  constructor() {
    super(getEnv('QLDB_LEDGER_NAME'), getEnv('QLDB_ACCOUNT_BALANCE_TABLE_NAME'));
  }
}
