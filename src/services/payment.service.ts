import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";
import { PAGINATION } from "../config/constants";
import { PaymentMethod } from "@prisma/client";

export class PaymentService {
  // Create payment
  static async create(
    userId: number,
    data: {
      distributorId: number;
      amountPaid: number;
      paymentDate: string;
      paymentMethod: PaymentMethod;
      transactionReference?: string;
    }
  ) {
    // Verify distributor exists and belongs to user
    const distributor = await prisma.distributor.findFirst({
      where: {
        id: data.distributorId,
        userId: userId,
      },
    });

    if (!distributor) {
      throw new AppError("Distributor not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!distributor.isActive) {
      throw new AppError("Distributor is deactivated", HTTP_STATUS.BAD_REQUEST);
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        distributorId: data.distributorId,
        amountPaid: data.amountPaid,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference,
      },
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
            contactNumber: true,
          },
        },
      },
    });

    return payment;
  }

  // Get all payments for a user (with pagination and filters)
  static async getAllForUser(
    userId: number,
    filters: {
      distributorId?: number;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      filters.limit || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: userId,
    };

    if (filters.distributorId) {
      where.distributorId = filters.distributorId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod as PaymentMethod;
    }

    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.paymentDate.lte = new Date(filters.endDate);
      }
    }

    // Get total count
    const total = await prisma.payment.count({ where });

    // Get payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get payment by ID
  static async getById(paymentId: number, userId?: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
            contactNumber: true,
            address: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership if userId provided
    if (userId && payment.userId !== userId) {
      throw new AppError(
        "You do not have access to this payment",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return payment;
  }

  // Update payment
  static async update(
    paymentId: number,
    userId: number,
    data: {
      amountPaid?: number;
      paymentDate?: string;
      paymentMethod?: PaymentMethod;
      transactionReference?: string;
    }
  ) {
    // Verify payment exists and user owns it
    await this.getById(paymentId, userId);

    const updateData: any = {};
    if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
    if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.transactionReference !== undefined) {
      updateData.transactionReference = data.transactionReference;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
          },
        },
      },
    });

    return updatedPayment;
  }

  // Delete payment
  static async delete(paymentId: number, userId: number) {
    // Verify payment exists and user owns it
    await this.getById(paymentId, userId);

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return { message: "Payment deleted successfully" };
  }

  // Get payments by distributor
  static async getByDistributor(
    distributorId: number,
    userId: number,
    page: number = 1,
    limit: number = 10
  ) {
    // Verify distributor belongs to user
    const distributor = await prisma.distributor.findFirst({
      where: {
        id: distributorId,
        userId: userId,
      },
    });

    if (!distributor) {
      throw new AppError("Distributor not found", HTTP_STATUS.NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const total = await prisma.payment.count({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      orderBy: {
        paymentDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get payment summary (all distributors)
  static async getSummary(
    userId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: any = {
      userId: userId,
    };

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.paymentDate.lte = new Date(filters.endDate);
      }
    }

    // Total payments
    const totalPayments = await prisma.payment.aggregate({
      where,
      _sum: {
        amountPaid: true,
      },
      _count: true,
    });

    // Payments by method
    const paymentsByMethod = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: {
        amountPaid: true,
      },
      _count: true,
    });

    // Payments by distributor
    const paymentsByDistributor = await prisma.payment.groupBy({
      by: ["distributorId"],
      where,
      _sum: {
        amountPaid: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          amountPaid: "desc",
        },
      },
      take: 10, // Top 10 distributors
    });

    // Get distributor names
    const distributorIds = paymentsByDistributor.map((p) => p.distributorId);
    const distributors = await prisma.distributor.findMany({
      where: {
        id: { in: distributorIds },
      },
      select: {
        id: true,
        distributorName: true,
      },
    });

    const distributorMap = new Map(
      distributors.map((d) => [d.id, d.distributorName])
    );

    return {
      total: {
        amount: Number(totalPayments._sum.amountPaid || 0),
        count: totalPayments._count,
      },
      byMethod: paymentsByMethod.map((pm) => ({
        method: pm.paymentMethod,
        amount: Number(pm._sum.amountPaid || 0),
        count: pm._count,
      })),
      byDistributor: paymentsByDistributor.map((pd) => ({
        distributorId: pd.distributorId,
        distributorName: distributorMap.get(pd.distributorId) || "Unknown",
        amount: Number(pd._sum.amountPaid || 0),
        count: pd._count,
      })),
    };
  }

  // Get payment summary for specific distributor
  static async getDistributorSummary(distributorId: number, userId: number) {
    // Verify distributor belongs to user
    const distributor = await prisma.distributor.findFirst({
      where: {
        id: distributorId,
        userId: userId,
      },
    });

    if (!distributor) {
      throw new AppError("Distributor not found", HTTP_STATUS.NOT_FOUND);
    }

    // Total payments made
    const totalPayments = await prisma.payment.aggregate({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      _sum: {
        amountPaid: true,
      },
      _count: true,
    });

    // Total orders amount
    const totalOrders = await prisma.order.aggregate({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Last payment
    const lastPayment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    const totalPaid = Number(totalPayments._sum.amountPaid || 0);
    const totalOwed = Number(totalOrders._sum.totalAmount || 0);
    const balance = totalOwed - totalPaid;

    return {
      distributor: {
        id: distributor.id,
        name: distributor.distributorName,
        contactNumber: distributor.contactNumber,
      },
      payments: {
        total: totalPaid,
        count: totalPayments._count,
        last: lastPayment
          ? {
              amount: Number(lastPayment.amountPaid),
              date: lastPayment.paymentDate,
              method: lastPayment.paymentMethod,
            }
          : null,
      },
      orders: {
        total: totalOwed,
        count: totalOrders._count,
      },
      balance: {
        amount: balance,
        status: balance > 0 ? "owed" : balance < 0 ? "credit" : "settled",
      },
    };
  }
}
