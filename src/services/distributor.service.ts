import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";

export class DistributorService {
  // Create new distributor
  static async create(
    userId: number,
    data: {
      distributorName: string;
      contactNumber: string;
      address: string;
    }
  ) {
    // Check if distributor with same name exists for THIS user
    const existingDistributor = await prisma.distributor.findFirst({
      where: {
        userId: userId, // ← NOW CHECKS PER USER
        distributorName: data.distributorName,
      },
    });

    if (existingDistributor) {
      throw new AppError(
        "You already have a distributor with this name",
        HTTP_STATUS.CONFLICT
      );
    }

    const distributor = await prisma.distributor.create({
      data: {
        userId: userId, // ← ASSIGN TO USER
        distributorName: data.distributorName,
        contactNumber: data.contactNumber,
        address: data.address,
      },
      select: {
        id: true,
        distributorName: true,
        contactNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    });

    return distributor;
  }

  // Get all distributors for a user
  static async getAllForUser(userId: number) {
    const distributors = await prisma.distributor.findMany({
      where: {
        userId: userId, // ← ONLY THIS USER'S DISTRIBUTORS
      },
      select: {
        id: true,
        distributorName: true,
        contactNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        distributorName: "asc",
      },
    });

    return distributors;
  }

  // Get all distributors (admin only)
  static async getAllForAdmin() {
    const distributors = await prisma.distributor.findMany({
      select: {
        id: true,
        userId: true, // ← SHOW WHICH USER OWNS IT
        distributorName: true,
        contactNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          // ← INCLUDE USER INFO
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            orders: true,
            payments: true,
          },
        },
      },
      orderBy: {
        distributorName: "asc",
      },
    });

    return distributors;
  }

  // Get distributor by ID
  static async getById(distributorId: number, userId?: number) {
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: {
        id: true,
        userId: true,
        distributorName: true,
        contactNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            payments: true,
            cylinderReturns: true,
          },
        },
      },
    });

    if (!distributor) {
      throw new AppError("Distributor not found", HTTP_STATUS.NOT_FOUND);
    }

    // If userId provided, verify ownership
    if (userId && distributor.userId !== userId) {
      throw new AppError(
        "You do not have access to this distributor",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return distributor;
  }

  // Update distributor
  static async update(
    distributorId: number,
    userId: number,
    data: {
      distributorName?: string;
      contactNumber?: string;
      address?: string;
    }
  ) {
    // Verify distributor exists and user owns it
    await this.getById(distributorId, userId);

    const updatedDistributor = await prisma.distributor.update({
      where: { id: distributorId },
      data: data,
      select: {
        id: true,
        distributorName: true,
        contactNumber: true,
        address: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedDistributor;
  }

  // Deactivate distributor
  static async deactivate(distributorId: number, userId: number) {
    const distributor = await this.getById(distributorId, userId);

    if (!distributor.isActive) {
      throw new AppError(
        "Distributor is already deactivated",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.distributor.update({
      where: { id: distributorId },
      data: { isActive: false },
    });

    return { message: "Distributor deactivated successfully" };
  }

  // Activate distributor
  static async activate(distributorId: number, userId: number) {
    const distributor = await this.getById(distributorId, userId);

    if (distributor.isActive) {
      throw new AppError(
        "Distributor is already active",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.distributor.update({
      where: { id: distributorId },
      data: { isActive: true },
    });

    return { message: "Distributor activated successfully" };
  }

  // Get financial balance (money owed to distributor)
  static async getFinancialBalance(distributorId: number, userId: number) {
    // Verify ownership
    await this.getById(distributorId, userId);

    // Calculate total orders amount
    const ordersSum = await prisma.order.aggregate({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Calculate total payments made
    const paymentsSum = await prisma.payment.aggregate({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      _sum: {
        amountPaid: true,
      },
    });

    const totalOrders = ordersSum._sum.totalAmount || 0;
    const totalPaid = paymentsSum._sum.amountPaid || 0;
    const balance = Number(totalOrders) - Number(totalPaid);

    return {
      totalOrders: Number(totalOrders),
      totalPaid: Number(totalPaid),
      balance: balance,
      status: balance > 0 ? "owed" : balance < 0 ? "credit" : "settled",
    };
  }

  // Get cylinder balance (empty cylinders owed to distributor)
  static async getCylinderBalance(distributorId: number, userId: number) {
    // Verify ownership
    await this.getById(distributorId, userId);

    // Get all cylinder types
    const cylinderTypes = await prisma.cylinderType.findMany({
      select: {
        id: true,
        company: true,
        typeCategory: true,
        weightKg: true,
      },
    });

    // Calculate balance for each cylinder type
    const balances = await Promise.all(
      cylinderTypes.map(async (cylinderType) => {
        // Full cylinders received
        const ordersSum = await prisma.orderItem.aggregate({
          where: {
            order: {
              userId: userId,
              distributorId: distributorId,
            },
            cylinderTypeId: cylinderType.id,
          },
          _sum: {
            quantity: true,
          },
        });

        // Empty cylinders returned
        const returnsSum = await prisma.cylinderReturn.aggregate({
          where: {
            userId: userId,
            distributorId: distributorId,
            cylinderTypeId: cylinderType.id,
          },
          _sum: {
            quantity: true,
          },
        });

        const received = ordersSum._sum.quantity || 0;
        const returned = returnsSum._sum.quantity || 0;
        const pending = received - returned;

        // Only include if there's any transaction
        if (received > 0 || returned > 0) {
          return {
            cylinderType: {
              id: cylinderType.id,
              company: cylinderType.company,
              category: cylinderType.typeCategory,
              weight: Number(cylinderType.weightKg),
            },
            fullReceived: received,
            emptyReturned: returned,
            pendingReturn: pending,
          };
        }
        return null;
      })
    );

    const filteredBalances = balances.filter((b) => b !== null);

    return {
      cylinderBalances: filteredBalances,
      summary: {
        totalPendingReturn: filteredBalances.reduce(
          (sum, b) => sum + (b?.pendingReturn || 0),
          0
        ),
      },
    };
  }

  // Get distributor summary (overview)
  static async getSummary(distributorId: number, userId: number) {
    const distributor = await this.getById(distributorId, userId);
    const financialBalance = await this.getFinancialBalance(
      distributorId,
      userId
    );
    const cylinderBalance = await this.getCylinderBalance(
      distributorId,
      userId
    );

    return {
      distributor: {
        id: distributor.id,
        name: distributor.distributorName,
        contactNumber: distributor.contactNumber,
        address: distributor.address,
        isActive: distributor.isActive,
      },
      financialBalance,
      cylinderBalance,
      stats: {
        totalOrders: distributor._count.orders,
        totalPayments: distributor._count.payments,
        totalReturns: distributor._count.cylinderReturns,
      },
    };
  }
}
