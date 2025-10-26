import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";

export class StaffService {
  // Create new staff member
  static async create(
    userId: number,
    data: {
      staffName: string;
      mobileNumber: string;
    }
  ) {
    // Check if staff with same mobile number exists for this user
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: userId,
        mobileNumber: data.mobileNumber,
      },
    });

    if (existingStaff) {
      throw new AppError(
        "Staff member with this mobile number already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    const staff = await prisma.staff.create({
      data: {
        userId: userId,
        staffName: data.staffName,
        mobileNumber: data.mobileNumber,
      },
      select: {
        id: true,
        staffName: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    return staff;
  }

  // Get all staff members for a user
  static async getAllForUser(userId: number) {
    const staff = await prisma.staff.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        staffName: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dailySales: true,
          },
        },
      },
      orderBy: {
        staffName: "asc",
      },
    });

    return staff;
  }

  // Get active staff only
  static async getActiveStaff(userId: number) {
    const staff = await prisma.staff.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        staffName: true,
        mobileNumber: true,
        createdAt: true,
      },
      orderBy: {
        staffName: "asc",
      },
    });

    return staff;
  }

  // Get all staff (admin only)
  static async getAllForAdmin() {
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        userId: true,
        staffName: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            dailySales: true,
          },
        },
      },
      orderBy: {
        staffName: "asc",
      },
    });

    return staff;
  }

  // Get staff by ID
  static async getById(staffId: number, userId?: number) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        userId: true,
        staffName: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dailySales: true,
          },
        },
      },
    });

    if (!staff) {
      throw new AppError("Staff member not found", HTTP_STATUS.NOT_FOUND);
    }

    // If userId provided, verify ownership
    if (userId && staff.userId !== userId) {
      throw new AppError(
        "You do not have access to this staff member",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return staff;
  }

  // Update staff
  static async update(
    staffId: number,
    userId: number,
    data: {
      staffName?: string;
      mobileNumber?: string;
    }
  ) {
    // Verify staff exists and user owns it
    await this.getById(staffId, userId);

    // If updating mobile number, check for duplicates
    if (data.mobileNumber) {
      const existingStaff = await prisma.staff.findFirst({
        where: {
          userId: userId,
          mobileNumber: data.mobileNumber,
          NOT: {
            id: staffId, // Exclude current staff
          },
        },
      });

      if (existingStaff) {
        throw new AppError(
          "Another staff member with this mobile number already exists",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: data,
      select: {
        id: true,
        staffName: true,
        mobileNumber: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedStaff;
  }

  // Deactivate staff
  static async deactivate(staffId: number, userId: number) {
    const staff = await this.getById(staffId, userId);

    if (!staff.isActive) {
      throw new AppError(
        "Staff member is already deactivated",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false },
    });

    return { message: "Staff member deactivated successfully" };
  }

  // Activate staff
  static async activate(staffId: number, userId: number) {
    const staff = await this.getById(staffId, userId);

    if (staff.isActive) {
      throw new AppError(
        "Staff member is already active",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: { isActive: true },
    });

    return { message: "Staff member activated successfully" };
  }

  // Get staff performance/statistics
  static async getPerformance(staffId: number, userId: number) {
    // Verify ownership
    await this.getById(staffId, userId);

    // Get all daily sales for this staff
    const salesRecords = await prisma.dailySales.findMany({
      where: {
        staffId: staffId,
        userId: userId,
      },
      include: {
        salesItems: {
          select: {
            quantitySold: true,
            sellingPricePerCylinder: true,
          },
        },
      },
      orderBy: {
        salesDate: "desc",
      },
    });

    // Calculate statistics
    const totalSalesDays = salesRecords.length;

    let totalRevenue = 0;
    let totalCylindersSold = 0;

    salesRecords.forEach((sale) => {
      sale.salesItems.forEach((item) => {
        const itemRevenue =
          item.quantitySold * Number(item.sellingPricePerCylinder);
        totalRevenue += itemRevenue;
        totalCylindersSold += item.quantitySold;
      });
    });

    const averageRevenuePerDay =
      totalSalesDays > 0 ? totalRevenue / totalSalesDays : 0;

    // Get first and last sale dates
    const firstSale =
      salesRecords.length > 0 ? salesRecords[salesRecords.length - 1] : null;
    const lastSale = salesRecords.length > 0 ? salesRecords[0] : null;

    return {
      totalSalesDays,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCylindersSold,
      averageRevenuePerDay: Number(averageRevenuePerDay.toFixed(2)),
      firstSaleDate: firstSale?.salesDate || null,
      lastSaleDate: lastSale?.salesDate || null,
    };
  }

  // Get staff summary with performance
  static async getSummary(staffId: number, userId: number) {
    const staff = await this.getById(staffId, userId);
    const performance = await this.getPerformance(staffId, userId);

    return {
      staff: {
        id: staff.id,
        name: staff.staffName,
        mobileNumber: staff.mobileNumber,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
      performance,
    };
  }

  // Get top performing staff (for dashboard)
  static async getTopPerformers(userId: number, limit: number = 5) {
    const allStaff = await prisma.staff.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        staffName: true,
      },
    });

    // Calculate performance for each staff
    const performancePromises = allStaff.map(async (staff) => {
      const performance = await this.getPerformance(staff.id, userId);
      return {
        staffId: staff.id,
        staffName: staff.staffName,
        totalRevenue: performance.totalRevenue,
        totalCylindersSold: performance.totalCylindersSold,
        totalSalesDays: performance.totalSalesDays,
      };
    });

    const performances = await Promise.all(performancePromises);

    // Sort by total revenue and return top performers
    const topPerformers = performances
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topPerformers;
  }
}
