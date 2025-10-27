import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";
import { PAGINATION } from "../config/constants";

export class CustomerService {
  // Create customer
  static async create(
    userId: number,
    data: {
      customerName: string;
      phoneNumber: string;
      address: string;
    }
  ) {
    // Check if customer with same name and phone exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId: userId,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
      },
    });

    if (existingCustomer) {
      throw new AppError(
        "Customer with this name and phone number already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    const customer = await prisma.customer.create({
      data: {
        userId: userId,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
      select: {
        id: true,
        customerName: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    });

    return customer;
  }

  // Get all customers for user
  static async getAllForUser(
    userId: number,
    filters?: {
      active?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      filters?.limit || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const where: any = {
      userId: userId,
    };

    if (filters?.active !== undefined) {
      where.isActive = filters.active;
    }

    const total = await prisma.customer.count({ where });

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customerCylinderLoans: true,
          },
        },
      },
      orderBy: {
        customerName: "asc",
      },
      skip,
      take: limit,
    });

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get customer by ID
  static async getById(customerId: number, userId?: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        userId: true,
        customerName: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customerCylinderLoans: true,
            loanCylinderReturns: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership if userId provided
    if (userId && customer.userId !== userId) {
      throw new AppError(
        "You do not have access to this customer",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return customer;
  }

  // Update customer
  static async update(
    customerId: number,
    userId: number,
    data: {
      customerName?: string;
      phoneNumber?: string;
      address?: string;
    }
  ) {
    // Verify customer exists and user owns it
    await this.getById(customerId, userId);

    // If updating name or phone, check for duplicates
    if (data.customerName || data.phoneNumber) {
      const whereClause: any = {
        userId: userId,
        NOT: {
          id: customerId,
        },
      };

      if (data.customerName && data.phoneNumber) {
        whereClause.customerName = data.customerName;
        whereClause.phoneNumber = data.phoneNumber;
      }

      const existingCustomer = await prisma.customer.findFirst({
        where: whereClause,
      });

      if (existingCustomer) {
        throw new AppError(
          "Another customer with this name and phone number already exists",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: data,
      select: {
        id: true,
        customerName: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedCustomer;
  }

  // Get customer loans
  static async getLoans(customerId: number, userId: number) {
    // Verify customer exists and user owns it
    await this.getById(customerId, userId);

    const loans = await prisma.customerCylinderLoan.findMany({
      where: {
        customerId: customerId,
        userId: userId,
      },
      include: {
        cylinderType: {
          select: {
            id: true,
            company: true,
            typeCategory: true,
            weightKg: true,
          },
        },
      },
      orderBy: {
        loanDate: "desc",
      },
    });

    return loans.map((loan) => ({
      id: loan.id,
      cylinderType: loan.cylinderType,
      quantityLoaned: loan.quantityLoaned,
      loanDate: loan.loanDate,
      createdAt: loan.createdAt,
    }));
  }

  // Get pending returns (loans - returns)
  static async getPendingReturns(customerId: number, userId: number) {
    // Verify customer exists and user owns it
    await this.getById(customerId, userId);

    // Get all loans
    const loans = await prisma.customerCylinderLoan.groupBy({
      by: ["cylinderTypeId"],
      where: {
        customerId: customerId,
        userId: userId,
      },
      _sum: {
        quantityLoaned: true,
      },
    });

    // Get all returns
    const returns = await prisma.loanCylinderReturn.groupBy({
      by: ["cylinderTypeId"],
      where: {
        customerId: customerId,
        userId: userId,
      },
      _sum: {
        quantityReturned: true,
      },
    });

    // Calculate pending per cylinder type
    const returnsMap = new Map(
      returns.map((r) => [r.cylinderTypeId, r._sum.quantityReturned || 0])
    );

    const pending = await Promise.all(
      loans.map(async (loan) => {
        const loaned = loan._sum.quantityLoaned || 0;
        const returned = returnsMap.get(loan.cylinderTypeId) || 0;
        const pendingQty = loaned - returned;

        if (pendingQty > 0) {
          const cylinderType = await prisma.cylinderType.findUnique({
            where: { id: loan.cylinderTypeId },
            select: {
              id: true,
              company: true,
              typeCategory: true,
              weightKg: true,
            },
          });

          return {
            cylinderType: cylinderType!,
            totalLoaned: loaned,
            totalReturned: returned,
            pendingReturn: pendingQty,
          };
        }
        return null;
      })
    );

    return pending.filter((p) => p !== null);
  }
}
