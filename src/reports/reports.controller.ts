import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { performance } from 'perf_hooks';
import { reportDto } from './dto';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  report() {
    return {
      'accounts.csv': this.reportsService.state('accounts'),
      'yearly.csv': this.reportsService.state('yearly'),
      'fs.csv': this.reportsService.state('fs'),
    };
  }

  @Post()
  @HttpCode(201)
  async generate() {
    const start = performance.now();
    const allDatas: reportDto = await this.reportsService.extractDatas();
    await this.reportsService.accounts(allDatas.accountBalances);
    await this.reportsService.yearly(allDatas.cashByYear);
    await this.reportsService.fs(allDatas.balances);
    return { message: 'finished', duration: ((performance.now() - start) / 1000).toFixed(2) };
  }
}
