import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { newTicketDto } from './dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await this.ticketsService.findAll();
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    if (typeof type === undefined || typeof companyId === undefined) {
      throw new BadRequestException('Type and companyId are required');
    }

    const ticketDto = await this.ticketsService.createTicket(newTicketDto);
    return ticketDto;
  }
}
