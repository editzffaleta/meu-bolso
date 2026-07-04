import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationError } from '@meubolso/shared';
import {
  ImportListResult,
  ImportStatement,
  ImportStatementOut,
} from '@meubolso/imports';
import { CurrentUser } from '../../shared/decorators';
import { PrismaAccountRepository } from '../accounts/account.prisma';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';
import { PrismaImportRepository } from './import.prisma';
import { CsvStatementParserImpl } from './csv-statement.parser';
import { OfxStatementParserImpl } from './ofx-statement.parser';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

interface ImportFileBody {
  accountId: string;
}

interface ListImportsQuery {
  page?: string;
  pageSize?: string;
}

@Controller('imports')
export class ImportsController {
  constructor(
    private readonly importRepository: PrismaImportRepository,
    private readonly transactionRepository: PrismaTransactionRepository,
    private readonly accountRepository: PrismaAccountRepository,
    private readonly csvStatementParser: CsvStatementParserImpl,
    private readonly ofxStatementParser: OfxStatementParserImpl,
  ) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImportFileBody,
    @CurrentUser('id') userId: string,
  ): Promise<ImportStatementOut> {
    const format = this.detectFormat(file?.originalname);

    const useCase = new ImportStatement(
      this.importRepository,
      this.transactionRepository,
      this.accountRepository,
      this.csvStatementParser,
      this.ofxStatementParser,
    );

    return useCase.execute({
      userId,
      accountId: body.accountId,
      fileName: file.originalname,
      format,
      content: file.buffer.toString('utf-8'),
    });
  }

  @Get()
  async list(
    @Query() query: ListImportsQuery,
    @CurrentUser('id') userId: string,
  ): Promise<ImportListResult> {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 20;

    return this.importRepository.findPage(userId, page, pageSize);
  }

  private detectFormat(fileName: string | undefined): 'csv' | 'ofx' {
    const extension = fileName?.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return 'csv';
    }

    if (extension === 'ofx') {
      return 'ofx';
    }

    throw new ValidationError('import.format.unsupported');
  }
}
