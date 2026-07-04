import { NotFoundError, UseCase } from "@meubolso/shared";
import { Account } from "../model";
import { AccountRepository } from "../provider";

export interface FindAccountByIdIn {
  id: string;
  userId: string;
}

export class FindAccountById implements UseCase<FindAccountByIdIn, Account> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: FindAccountByIdIn): Promise<Account> {
    const existing = await this.accountRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new NotFoundError("account.not.found");
    }

    return existing;
  }
}
