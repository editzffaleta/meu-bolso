import { UseCase } from "@meubolso/shared";
import { Account, AccountType } from "../model";
import { AccountRepository } from "../provider";

export interface CreateAccountIn {
  name: string;
  type: AccountType;
  institution?: string;
  initialBalance?: number;
  userId: string;
}

export class CreateAccount implements UseCase<CreateAccountIn, Account> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: CreateAccountIn): Promise<Account> {
    const account = new Account({
      name: input.name,
      type: input.type,
      institution: input.institution,
      initialBalance: input.initialBalance ?? 0,
      userId: input.userId,
    });

    account.validate();

    return this.accountRepository.create(account);
  }
}
