import { NotFoundError, UseCase } from "@meubolso/shared";
import { AccountRepository } from "../provider";

export interface DeleteAccountIn {
  id: string;
  userId: string;
}

export class DeleteAccount implements UseCase<DeleteAccountIn, void> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: DeleteAccountIn): Promise<void> {
    const existing = await this.accountRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new NotFoundError("account.not.found");
    }

    await this.accountRepository.delete(input.id, input.userId);
  }
}
