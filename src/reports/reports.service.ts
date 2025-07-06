import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { reportDto } from './dto';

@Injectable()
export class ReportsService {
  private states = {
    accounts: 'idle',
    yearly: 'idle',
    fs: 'idle',
  };

  private readonly categories = {
    'Income Statement': {
      Revenues: ['Sales Revenue'],
      Expenses: [
        'Cost of Goods Sold',
        'Salaries Expense',
        'Rent Expense',
        'Utilities Expense',
        'Interest Expense',
        'Tax Expense',
      ],
    },
    'Balance Sheet': {
      Assets: [
        'Cash',
        'Accounts Receivable',
        'Inventory',
        'Fixed Assets',
        'Prepaid Expenses',
      ],
      Liabilities: [
        'Accounts Payable',
        'Loan Payable',
        'Sales Tax Payable',
        'Accrued Liabilities',
        'Unearned Revenue',
        'Dividends Payable',
      ],
      Equity: ['Common Stock', 'Retained Earnings'],
    },
  };

  state(scope: string) {
    return this.states[scope];
  }

  async extractDatas(): Promise<reportDto> {
    const tmpDir = 'tmp';
    const allFiles: string[] = await fs.promises.readdir(tmpDir);
    if (allFiles.length === 0) {
      this.states.accounts = 'no files found';
      return {
        cashByYear: {},
        accountBalances: {},
        balances: {},
      };
    }
    let allLines: string[] = [];
    const cashByYear: Record<string, number> = {};
    const accountBalances: Record<string, number> = {};
    const balances: Record<string, number> = {};
    for (const section of Object.values(this.categories)) {
      for (const group of Object.values(section)) {
        for (const account of group) {
          balances[account] = 0;
        }
      }
    }

    for (const file of allFiles) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(tmpDir, file);
        const lines = await fs.promises.readFile(filePath, 'utf-8');
        allLines = allLines.concat(lines.trim().split('\n'));
      }
    }

    for (const line of allLines) {
      const [date, account, , debit, credit] = line.split(',');
      if (account === 'Cash') {
        const year = new Date(date).getFullYear();
        if (!cashByYear[year]) {
          cashByYear[year] = 0;
        }
        cashByYear[year] +=
          parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
      }
      if (!accountBalances[account]) {
        accountBalances[account] = 0;
      }
      accountBalances[account] +=
        parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));

      if (balances.hasOwnProperty(account)) {
        balances[account] +=
          parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
      }
    }

    return {
      cashByYear: cashByYear,
      accountBalances: accountBalances,
      balances: balances,
    };
  }

  async accounts(data: Record<string, number> = {}) {
    this.states.accounts = 'starting';
    const start = performance.now();
    const outputFile = 'out/accounts.csv';

    const output = ['Account,Balance'];
    for (const [account, balance] of Object.entries(data)) {
      output.push(`${account},${balance.toFixed(2)}`);
    }
    await fs.promises.writeFile(outputFile, output.join('\n'));
    this.states.accounts = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }

  async yearly(data: Record<string, number> = {}) {
    this.states.yearly = 'startingg';
    const start = performance.now();
    const outputFile = 'out/yearly.csv';
    const output = ['Financial Year,Cash Balance'];
    Object.keys(data)
      .sort()
      .forEach((year) => {
        output.push(`${year},${data[year].toFixed(2)}`);
      });
    await fs.promises.writeFile(outputFile, output.join('\n'));
    this.states.yearly = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }

  async fs(data: Record<string, number> = {}) {
    this.states.fs = 'starting';
    const start = performance.now();
    const outputFile = 'out/fs.csv';

    const output: string[] = [];
    output.push('Basic Financial Statement');
    output.push('');
    output.push('Income Statement');
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const account of this.categories['Income Statement']['Revenues']) {
      const value = data[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalRevenue += value;
    }
    for (const account of this.categories['Income Statement']['Expenses']) {
      const value = data[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalExpenses += value;
    }
    output.push(`Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`);
    output.push('');
    output.push('Balance Sheet');
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    output.push('Assets');
    for (const account of this.categories['Balance Sheet']['Assets']) {
      const value = data[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalAssets += value;
    }
    output.push(`Total Assets,${totalAssets.toFixed(2)}`);
    output.push('');
    output.push('Liabilities');
    for (const account of this.categories['Balance Sheet']['Liabilities']) {
      const value = data[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalLiabilities += value;
    }
    output.push(`Total Liabilities,${totalLiabilities.toFixed(2)}`);
    output.push('');
    output.push('Equity');
    for (const account of this.categories['Balance Sheet']['Equity']) {
      const value = data[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalEquity += value;
    }
    output.push(
      `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
    );
    totalEquity += totalRevenue - totalExpenses;
    output.push(`Total Equity,${totalEquity.toFixed(2)}`);
    output.push('');
    output.push(
      `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
    );
    await fs.promises.writeFile(outputFile, output.join('\n'));
    this.states.fs = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }
}
