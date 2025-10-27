import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";
import { PAGINATION } from "../config/constants";

interface SalesItemInput {
  cylinderTypeId: number;
  quantitySold: number;
  sellingPricePerCylinder: number;
}

interface EmptyReceivedInput {
  cylinderTypeId: number;
  quantityReceived: number;
}

interface CustomerLoanInput {
  customerId: number;
  cylinderTypeId: number;
  quantityLoaned: number;
}

export class SalesService {
  // Create daily sales
  static async create(
    userId: number,
    data: {
      staffId: number;
      salesDate: string;
      items: SalesItemInput[];
      emptiesReceived?: EmptyReceivedInput[];
      customerLoans?: CustomerLoanInput[];
    }
  ) {
    // Verify staff exists and belongs to user
    const staff = await prisma.staff.findFirst({
      where: {
        id: data.staffId,
        userId: userId,
      },
    });

    if (!staff) {
      throw new AppError("Staff member not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!staff.isActive) {
      throw new AppError(
        "Staff member is deactivated",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify all cylinder types exist
    const allCylinderTypeIds = [
      ...data.items.map((item) => item.cylinderTypeId),
      ...(data.emptiesReceived || []).map((empty) => empty.cylinderTypeId),
      ...(data.customerLoans || []).map((loan) => loan.cylinderTypeId),
    ];
    const uniqueCylinderTypeIds = [...new Set(allCylinderTypeIds)];

    const cylinderTypes = await prisma.cylinderType.findMany({
      where: {
        id: { in: uniqueCylinderTypeIds },
      },
    });

    if (cylinderTypes.length !== uniqueCylinderTypeIds.length) {
      throw new AppError(
        "One or more cylinder types not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    // If customer loans exist, verify customers
    if (data.customerLoans && data.customerLoans.length > 0) {
      const customerIds = [
        ...new Set(data.customerLoans.map((loan) => loan.customerId)),
      ];
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          userId: userId,
        },
      });

      if (customers.length !== customerIds.length) {
        throw new AppError(
          "One or more customers not found",
          HTTP_STATUS.NOT_FOUND
        );
      }
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create daily sales
      const dailySales = await tx.dailySales.create({
        data: {
          userId: userId,
          staffId: data.staffId,
          salesDate: new Date(data.salesDate),
        },
      });

      // 2. Create sales items
      const salesItemsData = data.items.map((item) => ({
        salesId: dailySales.id,
        cylinderTypeId: item.cylinderTypeId,
        quantitySold: item.quantitySold,
        sellingPricePerCylinder: item.sellingPricePerCylinder,
      }));

      await tx.salesItem.createMany({
        data: salesItemsData,
      });

      // 3. Create empty received records (if any)
      if (data.emptiesReceived && data.emptiesReceived.length > 0) {
        const emptiesData = data.emptiesReceived.map((empty) => ({
          salesId: dailySales.id,
          cylinderTypeId: empty.cylinderTypeId,
          quantityReceived: empty.quantityReceived,
        }));

        await tx.emptyReceivedOnSale.createMany({
          data: emptiesData,
        });
      }

      // 4. Create customer loans (if any)
      if (data.customerLoans && data.customerLoans.length > 0) {
        const loansData = data.customerLoans.map((loan) => ({
          customerId: loan.customerId,
          userId: userId,
          cylinderTypeId: loan.cylinderTypeId,
          quantityLoaned: loan.quantityLoaned,
          loanDate: new Date(data.salesDate),
        }));

        await tx.customerCylinderLoan.createMany({
          data: loansData,
        });
      }

      // 5. Update inventory for sales (full cylinders out)
      for (const item of data.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            userId_cylinderTypeId: {
              userId: userId,
              cylinderTypeId: item.cylinderTypeId,
            },
          },
        });

        if (!inventory) {
          throw new AppError(
            `No inventory found for cylinder type ${item.cylinderTypeId}`,
            HTTP_STATUS.BAD_REQUEST
          );
        }

        // Check sufficient stock
        if (inventory.fullCylinders < item.quantitySold) {
          const cylinderType = cylinderTypes.find(
            (ct) => ct.id === item.cylinderTypeId
          );
          throw new AppError(
            `Insufficient stock for ${cylinderType?.company} ${cylinderType?.typeCategory} ${cylinderType?.weightKg}kg. Available: ${inventory.fullCylinders}, Requested: ${item.quantitySold}`,
            HTTP_STATUS.BAD_REQUEST
          );
        }

        await tx.inventory.update({
          where: {
            userId_cylinderTypeId: {
              userId: userId,
              cylinderTypeId: item.cylinderTypeId,
            },
          },
          data: {
            fullCylinders: {
              decrement: item.quantitySold,
            },
          },
        });
      }

      // 6. Update inventory for empties received (empty cylinders in)
      if (data.emptiesReceived && data.emptiesReceived.length > 0) {
        for (const empty of data.emptiesReceived) {
          const inventory = await tx.inventory.findUnique({
            where: {
              userId_cylinderTypeId: {
                userId: userId,
                cylinderTypeId: empty.cylinderTypeId,
              },
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: {
                userId_cylinderTypeId: {
                  userId: userId,
                  cylinderTypeId: empty.cylinderTypeId,
                },
              },
              data: {
                emptyCylinders: {
                  increment: empty.quantityReceived,
                },
              },
            });
          } else {
            // Create inventory if doesn't exist
            await tx.inventory.create({
              data: {
                userId: userId,
                cylinderTypeId: empty.cylinderTypeId,
                fullCylinders: 0,
                emptyCylinders: empty.quantityReceived,
              },
            });
          }
        }
      }

      // Return created sales with all details
      return await tx.dailySales.findUnique({
        where: { id: dailySales.id },
        include: {
          staff: {
            select: {
              id: true,
              staffName: true,
            },
          },
          salesItems: {
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
          },
          emptyReceivedOnSales: {
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
          },
        },
      });
    });
  }

  // Get all sales for user (with pagination and filters)
  static async getAllForUser(
    userId: number,
    filters: {
      staffId?: number;
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

    const where: any = {
      userId: userId,
    };

    if (filters.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters.startDate || filters.endDate) {
      where.salesDate = {};
      if (filters.startDate) {
        where.salesDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.salesDate.lte = new Date(filters.endDate);
      }
    }

    const total = await prisma.dailySales.count({ where });

    const sales = await prisma.dailySales.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            staffName: true,
          },
        },
        _count: {
          select: {
            salesItems: true,
            emptyReceivedOnSales: true,
          },
        },
      },
      orderBy: {
        salesDate: "desc",
      },
      skip,
      take: limit,
    });

    // Calculate totals for each sale
    const salesWithTotals = await Promise.all(
      sales.map(async (sale) => {
        const items = await prisma.salesItem.findMany({
          where: { salesId: sale.id },
        });

        const totalRevenue = items.reduce(
          (sum, item) =>
            sum + item.quantitySold * Number(item.sellingPricePerCylinder),
          0
        );

        const totalCylindersSold = items.reduce(
          (sum, item) => sum + item.quantitySold,
          0
        );

        return {
          ...sale,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalCylindersSold,
        };
      })
    );

    return {
      sales: salesWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get sales by ID
  static async getById(salesId: number, userId?: number) {
    const sales = await prisma.dailySales.findUnique({
      where: { id: salesId },
      include: {
        staff: {
          select: {
            id: true,
            staffName: true,
            mobileNumber: true,
          },
        },
        salesItems: {
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
        },
        emptyReceivedOnSales: {
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
        },
      },
    });

    if (!sales) {
      throw new AppError("Sales record not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership if userId provided
    if (userId && sales.userId !== userId) {
      throw new AppError(
        "You do not have access to this sales record",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Calculate totals
    const totalRevenue = sales.salesItems.reduce(
      (sum, item) =>
        sum + item.quantitySold * Number(item.sellingPricePerCylinder),
      0
    );

    const totalCylindersSold = sales.salesItems.reduce(
      (sum, item) => sum + item.quantitySold,
      0
    );

    const totalEmptiesReceived = sales.emptyReceivedOnSales.reduce(
      (sum, empty) => sum + empty.quantityReceived,
      0
    );

    return {
      ...sales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCylindersSold,
      totalEmptiesReceived,
    };
  }

  // Get sales by staff
  static async getByStaff(
    staffId: number,
    userId: number,
    page: number = 1,
    limit: number = 10
  ) {
    // Verify staff belongs to user
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        userId: userId,
      },
    });

    if (!staff) {
      throw new AppError("Staff member not found", HTTP_STATUS.NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const total = await prisma.dailySales.count({
      where: {
        userId: userId,
        staffId: staffId,
      },
    });

    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        staffId: staffId,
      },
      include: {
        _count: {
          select: {
            salesItems: true,
          },
        },
      },
      orderBy: {
        salesDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get sales by date
  static async getByDate(date: string, userId: number) {
    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: new Date(date),
      },
      include: {
        staff: {
          select: {
            id: true,
            staffName: true,
          },
        },
        salesItems: {
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
        },
        emptyReceivedOnSales: {
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
        },
      },
      orderBy: {
        staff: {
          staffName: "asc",
        },
      },
    });

    // Calculate totals for the day
    const dayTotal = sales.reduce(
      (acc, sale) => {
        const revenue = sale.salesItems.reduce(
          (sum, item) =>
            sum + item.quantitySold * Number(item.sellingPricePerCylinder),
          0
        );
        const cylindersSold = sale.salesItems.reduce(
          (sum, item) => sum + item.quantitySold,
          0
        );
        const emptiesReceived = sale.emptyReceivedOnSales.reduce(
          (sum, empty) => sum + empty.quantityReceived,
          0
        );

        return {
          totalRevenue: acc.totalRevenue + revenue,
          totalCylindersSold: acc.totalCylindersSold + cylindersSold,
          totalEmptiesReceived: acc.totalEmptiesReceived + emptiesReceived,
        };
      },
      { totalRevenue: 0, totalCylindersSold: 0, totalEmptiesReceived: 0 }
    );

    return {
      date: new Date(date),
      sales,
      summary: {
        totalRevenue: Number(dayTotal.totalRevenue.toFixed(2)),
        totalCylindersSold: dayTotal.totalCylindersSold,
        totalEmptiesReceived: dayTotal.totalEmptiesReceived,
        salesCount: sales.length,
      },
    };
  }

  // Get complete sale details (including customer loans)
  static async getDetails(salesId: number, userId: number) {
    const sales = await this.getById(salesId, userId);

    // Get customer loans for this sale date
    const customerLoans = await prisma.customerCylinderLoan.findMany({
      where: {
        userId: userId,
        loanDate: sales.salesDate,
      },
      include: {
        customer: {
          select: {
            id: true,
            customerName: true,
            phoneNumber: true,
          },
        },
        cylinderType: {
          select: {
            id: true,
            company: true,
            typeCategory: true,
            weightKg: true,
          },
        },
      },
    });

    return {
      ...sales,
      customerLoans: customerLoans.map((loan) => ({
        customer: loan.customer,
        cylinderType: loan.cylinderType,
        quantityLoaned: loan.quantityLoaned,
      })),
    };
  }

  // Get sales summary
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
      where.salesDate = {};
      if (filters.startDate) {
        where.salesDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.salesDate.lte = new Date(filters.endDate);
      }
    }

    // Get all sales in period
    const sales = await prisma.dailySales.findMany({
      where,
      include: {
        salesItems: true,
        emptyReceivedOnSales: true,
      },
    });

    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.salesItems.reduce(
          (itemSum, item) =>
            itemSum + item.quantitySold * Number(item.sellingPricePerCylinder),
          0
        )
      );
    }, 0);

    const totalCylindersSold = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.salesItems.reduce(
          (itemSum, item) => itemSum + item.quantitySold,
          0
        )
      );
    }, 0);

    const totalEmptiesReceived = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.emptyReceivedOnSales.reduce(
          (emptySum, empty) => emptySum + empty.quantityReceived,
          0
        )
      );
    }, 0);

    // Sales by staff
    const salesByStaff = await prisma.dailySales.groupBy({
      by: ["staffId"],
      where,
      _count: true,
    });

    const staffIds = salesByStaff.map((s) => s.staffId);
    const staffMembers = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        staffName: true,
      },
    });

    const staffMap = new Map(staffMembers.map((s) => [s.id, s.staffName]));

    const staffSummary = await Promise.all(
      salesByStaff.map(async (s) => {
        const staffSales = sales.filter((sale) => sale.staffId === s.staffId);
        const revenue = staffSales.reduce((sum, sale) => {
          return (
            sum +
            sale.salesItems.reduce(
              (itemSum, item) =>
                itemSum +
                item.quantitySold * Number(item.sellingPricePerCylinder),
              0
            )
          );
        }, 0);

        return {
          staffId: s.staffId,
          staffName: staffMap.get(s.staffId) || "Unknown",
          salesCount: s._count,
          revenue: Number(revenue.toFixed(2)),
        };
      })
    );

    return {
      total: {
        revenue: Number(totalRevenue.toFixed(2)),
        cylindersSold: totalCylindersSold,
        emptiesReceived: totalEmptiesReceived,
        salesRecords: sales.length,
      },
      byStaff: staffSummary.sort((a, b) => b.revenue - a.revenue),
    };
  }

  // Get sales analytics
  static async getAnalytics(
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
      where.salesDate = {};
      if (filters.startDate) {
        where.salesDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.salesDate.lte = new Date(filters.endDate);
      }
    }

    // Get sales items
    const salesItems = await prisma.salesItem.findMany({
      where: {
        dailySales: where,
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
        dailySales: {
          select: {
            salesDate: true,
          },
        },
      },
    });

    // Sales by cylinder type
    const byCylinderType = salesItems.reduce((acc, item) => {
      const key = `${item.cylinderType.company}_${item.cylinderType.typeCategory}_${item.cylinderType.weightKg}`;

      if (!acc[key]) {
        acc[key] = {
          cylinderType: item.cylinderType,
          quantitySold: 0,
          revenue: 0,
        };
      }

      acc[key].quantitySold += item.quantitySold;
      acc[key].revenue +=
        item.quantitySold * Number(item.sellingPricePerCylinder);

      return acc;
    }, {} as Record<string, any>);

    const cylinderTypeAnalytics = Object.values(byCylinderType)
      .map((item: any) => ({
        cylinderType: item.cylinderType,
        quantitySold: item.quantitySold,
        revenue: Number(item.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Sales by company
    const byCompany = salesItems.reduce((acc, item) => {
      const company = item.cylinderType.company;

      if (!acc[company]) {
        acc[company] = {
          quantitySold: 0,
          revenue: 0,
        };
      }

      acc[company].quantitySold += item.quantitySold;
      acc[company].revenue +=
        item.quantitySold * Number(item.sellingPricePerCylinder);

      return acc;
    }, {} as Record<string, any>);

    const companyAnalytics = Object.entries(byCompany)
      .map(([company, data]: [string, any]) => ({
        company,
        quantitySold: data.quantitySold,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Average price per cylinder type
    const avgPrices = salesItems.reduce((acc, item) => {
      const key = `${item.cylinderType.company}_${item.cylinderType.typeCategory}_${item.cylinderType.weightKg}`;

      if (!acc[key]) {
        acc[key] = {
          cylinderType: item.cylinderType,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }

      acc[key].totalAmount +=
        item.quantitySold * Number(item.sellingPricePerCylinder);
      acc[key].totalQuantity += item.quantitySold;

      return acc;
    }, {} as Record<string, any>);

    const averagePrices = Object.values(avgPrices).map((item: any) => ({
      cylinderType: item.cylinderType,
      averagePrice: Number((item.totalAmount / item.totalQuantity).toFixed(2)),
    }));

    return {
      byCylinderType: cylinderTypeAnalytics,
      byCompany: companyAnalytics,
      averagePrices,
    };
  }
}
