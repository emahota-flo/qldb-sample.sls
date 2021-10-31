export type OperationType = 'accrual' | 'deduction';

export interface AccountBalanceUpdateBody {
  operationType: OperationType;
  value: number;
}
