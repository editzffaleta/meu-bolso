import { UseCase } from "@meubolso/shared";
import { Account } from "../model";
import { AccountRepository } from "../provider";

export interface ListAccountsIn {
  userId: string;
}

export class ListAccounts implements UseCase<ListAccountsIn, Account[]> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: ListAccountsIn): Promise<Account[]> {
    return this.accountRepository.findAll(input.userId);
  }
}
