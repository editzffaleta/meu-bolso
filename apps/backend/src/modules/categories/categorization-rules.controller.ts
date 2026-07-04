import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApplyRulesOut,
  CategorizationRule,
  CreateCategorizationRule,
  DeleteCategorizationRule,
  ListCategorizationRules,
  RecategorizeAll,
  UpdateCategorizationRule,
} from '@meubolso/categories';
import { CurrentUser } from '../../shared/decorators';
import { PrismaCategoryRepository } from './category.prisma';
import { PrismaCategorizationRuleRepository } from './categorization-rule.prisma';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';
import { TransactionRepositoryCategorizationAdapter } from './transaction-repository-categorization.adapter';

interface CreateCategorizationRuleBody {
  keyword: string;
  categoryId: string;
  priority?: number;
}

interface UpdateCategorizationRuleBody {
  keyword?: string;
  categoryId?: string;
  priority?: number;
}

interface RecategorizeBody {
  includeAlreadyCategorized?: boolean;
}

@Controller('categorization-rules')
export class CategorizationRulesController {
  constructor(
    private readonly categorizationRuleRepository: PrismaCategorizationRuleRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
    private readonly transactionRepository: PrismaTransactionRepository,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateCategorizationRuleBody,
    @CurrentUser('id') userId: string,
  ): Promise<CategorizationRule> {
    const useCase = new CreateCategorizationRule(
      this.categorizationRuleRepository,
      this.categoryRepository,
    );

    return useCase.execute({ ...body, userId });
  }

  @Get()
  async list(@CurrentUser('id') userId: string): Promise<CategorizationRule[]> {
    const useCase = new ListCategorizationRules(
      this.categorizationRuleRepository,
    );

    return useCase.execute({ userId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCategorizationRuleBody,
    @CurrentUser('id') userId: string,
  ): Promise<CategorizationRule> {
    const useCase = new UpdateCategorizationRule(
      this.categorizationRuleRepository,
      this.categoryRepository,
    );

    return useCase.execute({ ...body, id, userId });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const useCase = new DeleteCategorizationRule(
      this.categorizationRuleRepository,
    );

    await useCase.execute({ id, userId });
  }

  @Post('recategorize')
  @HttpCode(200)
  async recategorize(
    @Body() body: RecategorizeBody,
    @CurrentUser('id') userId: string,
  ): Promise<ApplyRulesOut> {
    const useCase = new RecategorizeAll(
      this.categorizationRuleRepository,
      new TransactionRepositoryCategorizationAdapter(
        this.transactionRepository,
      ),
    );

    return useCase.execute({
      userId,
      includeAlreadyCategorized: body?.includeAlreadyCategorized,
    });
  }
}
