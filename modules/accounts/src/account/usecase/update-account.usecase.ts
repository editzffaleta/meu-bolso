import { NotFoundError, UseCase } from "@meubolso/shared";
import { Account, AccountType } from "../model";
import { AccountRepository } from "../provider";

export interface UpdateAccountIn {
  id: string;
  userId: string;
  name?: string;
  type?: AccountType;
  institution?: string;
  initialBalance?: number;
}

export class UpdateAccount implements UseCase<UpdateAccountIn, Account> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: UpdateAccountIn): Promise<Account> {
    const existing = await this.accountRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new NotFoundError("account.not.found");
    }

    const updated = existing.clone({
      name: input.name ?? existing.name,
      type: input.type ?? existing.type,
      institution: input.institution ?? existing.institution,
      initialBalance: input.initialBalance ?? existing.initialBalance,
    });

    updated.validate();

    return this.accountRepository.update(updated);
  }
}
