import { QLDBInitService } from '@services/qldb-init.service';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';

export interface QLDBGeneralInterface {
  id: string;
}

export interface QLDBTransactionResponse {
  documentId: string;
}

export interface QLDBInterface<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T>;
  getByDocumentId(id: string): Promise<T>;
  addItems(items: T[]): Promise<QLDBTransactionResponse[]>;
  updateItemById(id: string, data: Partial<T>): Promise<QLDBTransactionResponse[]>;
  updateItemByParam(param: Partial<T>, data: Partial<T>): Promise<QLDBTransactionResponse[]>;
  searchAndUpdate(objectForSearch: Partial<T>, objectForUpdate: Partial<T>): Promise<QLDBTransactionResponse[]>;
  searchByParams(searchObject: Partial<T>): Promise<T[]>;
}

export abstract class QLDBModel<T> extends QLDBInitService implements QLDBInterface<T> {
  protected constructor(private readonly ledgerName: string, private readonly tableName: string) {
    super(ledgerName);
  }

  public getAll(): Promise<T[]> {
    return this.request(`SELECT * FROM ${this.tableName}`) as Promise<T[]>;
  }

  public async getById(id: string): Promise<T> {
    return (await this.request(`SELECT * FROM ${this.tableName} AS item WHERE item.id = ?`, id))[0] as T;
  }

  public async getByDocumentId(documentId: string): Promise<T> {
    return (
      await this.request(`SELECT * FROM ${this.tableName} AS item BY item_id WHERE item_id = ?`, documentId)
    )[0] as T;
  }

  public searchByParams(searchObject: Partial<T>): Promise<T[]> {
    const { additionalQueryStr, values } = this.parseObjectToDataForQLDB(searchObject);
    const query = `SELECT * FROM ${this.tableName} AS item WHERE ${additionalQueryStr}`;

    return this.request(query, ...values) as Promise<T[]>;
  }

  public addItems(items: T[]): Promise<QLDBTransactionResponse[]> {
    return this.request(`INSERT INTO ${this.tableName} ?`, items) as Promise<QLDBTransactionResponse[]>;
  }

  public updateItemById(id: string, data: Partial<T>): Promise<QLDBTransactionResponse[]> {
    const { additionalQueryStr, values } = this.parseObjectToDataForQLDB(data);
    const query = `UPDATE ${this.tableName} as item SET ${additionalQueryStr} WHERE item.id = ?`;
    return this.request(query, ...values, id) as Promise<QLDBTransactionResponse[]>;
  }

  public updateItemByParam(param: Partial<T>, data: Partial<T>): Promise<QLDBTransactionResponse[]> {
    const key = Object.keys(param)[0];
    const value = Object.values(param)[0];

    const { additionalQueryStr, values } = this.parseObjectToDataForQLDB(data);
    const query = `UPDATE ${this.tableName} as item SET ${additionalQueryStr} WHERE item.${key} = ?`;
    return this.request(query, ...values, value) as Promise<QLDBTransactionResponse[]>;
  }

  public searchAndUpdate(objectForSearch: Partial<T>, objectForUpdate: Partial<T>): Promise<QLDBTransactionResponse[]> {
    const qldbSearch = this.parseObjectToDataForQLDB(objectForSearch);
    const qldbData = this.parseObjectToDataForQLDB(objectForUpdate);
    const query = `UPDATE ${this.tableName} as item SET ${qldbData.additionalQueryStr} WHERE ${qldbSearch.additionalQueryStr}`;
    return this.request(query, ...qldbData.values, ...qldbSearch.values) as Promise<QLDBTransactionResponse[]>;
  }

  private request(query: string, ...parameters: unknown[]): Promise<T[] | QLDBTransactionResponse[]> {
    return this.qldbDriver.executeLambda<T[] | QLDBTransactionResponse[]>(async (txn: TransactionExecutor) => {
      const response = await txn.execute(query, ...parameters);
      return response['_resultList'] as T[] | QLDBTransactionResponse[];
    });
  }

  private parseObjectToDataForQLDB(object: Partial<T>): { additionalQueryStr: string; values: unknown[] } {
    const objectKeys: string[] = Object.keys(object);
    const objectValues: string[] = Object.values(object);

    const additionalQueryStr = objectKeys.map((key) => `item.${key} = ?`).join(', ');

    return { additionalQueryStr, values: objectValues };
  }
}
