import { BadRequestException, Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';

interface newTicketDto {
  type: TicketType;
  companyId: number;
}

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Controller('api/v1/tickets')
export class TicketsController {
  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    if (typeof type === undefined || typeof companyId === undefined) {
      throw new BadRequestException('Type and companyId are required');
    }

    function getCategoryFromType(ticketType: TicketType): TicketCategory {
      switch (ticketType) {
        case TicketType.managementReport:
          return TicketCategory.accounting;
        case TicketType.registrationAddressChange:
          return TicketCategory.corporate;
        case TicketType.strikeOff:
          return TicketCategory.management;
        default:
          throw new BadRequestException(`Unknown ticket type: ${ticketType}`);
      }
    }

    function getUserRoleFromType(ticketType: TicketType): UserRole {
      switch (ticketType) {
        case TicketType.managementReport:
          return UserRole.accountant;
        case TicketType.registrationAddressChange:
          return UserRole.corporateSecretary;
        case TicketType.strikeOff:
          return UserRole.director;
        default:
          throw new BadRequestException(`Unknown ticket type: ${ticketType}`);
      }
    }

    const category = getCategoryFromType(type);

    let userRole = getUserRoleFromType(type);

    let assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    const directors = await User.findAll({
      where: { companyId, role: UserRole.director },
      order: [['createdAt', 'DESC']],
    });

    const racTicket = await Ticket.findOne({
      where: { companyId, type: TicketType.registrationAddressChange, status: TicketStatus.open },
    });

    // CHALLENGE 1: if company has registrationAddressChange ticket, cannot create another one
    if (racTicket && type === TicketType.registrationAddressChange) {
      throw new ConflictException(
        `Cannot create a ticket with multiple type of ${TicketType.registrationAddressChange} for company ${companyId}`,
      );
    }

    // CHALLENGE 1: if cannot find corporate secretary, assign to director
    if (assignees.length === 0 
      && type === TicketType.registrationAddressChange 
      && userRole === UserRole.corporateSecretary) {
      assignees = directors?.length > 0 ? directors : [];
      userRole = UserRole.director;
    }

    if (assignees.length === 0) {
      throw new ConflictException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );
    }

    // CHALLENGE 2: if multiple users with director role, cannot create a ticket
    if ((userRole === UserRole.corporateSecretary 
      || userRole === UserRole.director) && assignees.length > 1) {
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );
    }

    const assignee = assignees[0];


    if (type === TicketType.strikeOff) {
      // CHALLENGE 2: resolve all tickets if ticket type is strikeOff
      await Ticket.update(
        { status: TicketStatus.resolved },
        {
          where: {
            companyId,
            status: TicketStatus.open,
          },
        },
      );
    }

    const ticket = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });

    const ticketDto: TicketDto = {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };

    return ticketDto;
  }
}
