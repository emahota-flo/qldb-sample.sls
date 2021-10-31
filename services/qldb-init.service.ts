import { getEnv } from '@helper/environment';
import { QldbDriver, RetryConfig, TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import { Agent } from 'https';

const maxConcurrentTransactions = 10;
const retryLimit = 4;

const serviceConfigurationOptions = {
  region: getEnv('REGION'),
  httpOptions: {
    agent: new Agent({
      keepAlive: true,
      maxSockets: maxConcurrentTransactions,
    }),
  },
};

const retryConfig: RetryConfig = new RetryConfig(retryLimit);

export class QLDBInitService {
  protected readonly qldbDriver: QldbDriver;

  constructor(ledgerName: string) {
    this.qldbDriver = new QldbDriver(ledgerName, serviceConfigurationOptions, maxConcurrentTransactions, retryConfig);
  }

  public async createTable(tableName: string): Promise<void> {
    await this.qldbDriver.executeLambda(async (txn: TransactionExecutor) => {
      await txn.execute(`CREATE TABLE ${tableName}`);
    });
  }

  public async createIndex(tableName: string, indexAttributeName: string): Promise<void> {
    await this.qldbDriver.executeLambda(async (txn: TransactionExecutor) => {
      await txn.execute(`CREATE INDEX on ${tableName} (${indexAttributeName})`);
    });
  }
}