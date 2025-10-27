import { prisma } from "../config/prisma";

export class ReportService {
  // ============================================
  // DASHBOARD STATISTICS
  // ============================================

  static async getDashboard(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's sales
    const todaySales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: today,
      },
      include: {
        salesItems: true,
        staff: {
          select: {
            staffName: true,
          },
        },
      },
    });

    const todayRevenue = todaySales.reduce((sum, sale) => {
      return (
        sum +
        sale.salesItems.reduce(
          (itemSum, item) =>
            itemSum + item.quantitySold * Number(item.sellingPricePerCylinder),
          0
        )
      );
    }, 0);

    const todayCylindersSold = todaySales.reduce((sum, sale) => {
      return (
        sum +
        sale.salesItems.reduce(
          (itemSum, item) => itemSum + item.quantitySold,
          0
        )
      );
    }, 0);

    // Low stock items
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        userId: userId,
        fullCylinders: {
          lt: 10,
        },
      },
      include: {
        cylinderType: {
          select: {
            company: true,
            typeCategory: true,
            weightKg: true,
          },
        },
      },
      orderBy: {
        fullCylinders: "asc",
      },
      take: 5,
    });

    // Outstanding distributor balances
    const distributors = await prisma.distributor.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        distributorName: true,
      },
    });

    const outstandingBalances = await Promise.all(
      distributors.map(async (distributor) => {
        const ordersSum = await prisma.order.aggregate({
          where: {
            userId: userId,
            distributorId: distributor.id,
          },
          _sum: {
            totalAmount: true,
          },
        });

        const paymentsSum = await prisma.payment.aggregate({
          where: {
            userId: userId,
            distributorId: distributor.id,
          },
          _sum: {
            amountPaid: true,
          },
        });

        const balance =
          Number(ordersSum._sum.totalAmount || 0) -
          Number(paymentsSum._sum.amountPaid || 0);

        if (balance > 0) {
          return {
            distributorId: distributor.id,
            distributorName: distributor.distributorName,
            balance: balance,
          };
        }
        return null;
      })
    );

    const filteredBalances = outstandingBalances.filter((b) => b !== null);

    // Active staff count
    const activeStaffCount = await prisma.staff.count({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    // Total inventory value (approximate)
    const inventory = await prisma.inventory.findMany({
      where: { userId: userId },
      include: {
        cylinderType: true,
      },
    });

    let totalInventoryValue = 0;
    for (const inv of inventory) {
      const latestOrder = await prisma.orderItem.findFirst({
        where: {
          order: {
            userId: userId,
          },
          cylinderTypeId: inv.cylinderTypeId,
        },
        orderBy: {
          order: {
            orderDate: "desc",
          },
        },
        select: {
          pricePerCylinder: true,
        },
      });

      if (latestOrder) {
        totalInventoryValue +=
          inv.fullCylinders * Number(latestOrder.pricePerCylinder);
      }
    }

    return {
      today: {
        date: today,
        revenue: Number(todayRevenue.toFixed(2)),
        cylindersSold: todayCylindersSold,
        salesRecords: todaySales.length,
      },
      lowStock: {
        count: lowStockItems.length,
        items: lowStockItems.map((item) => ({
          cylinderType: item.cylinderType,
          fullCylinders: item.fullCylinders,
          emptyCylinders: item.emptyCylinders,
        })),
      },
      outstandingBalances: {
        count: filteredBalances.length,
        total: filteredBalances.reduce((sum, b) => sum + (b?.balance || 0), 0),
        items: filteredBalances,
      },
      staff: {
        activeCount: activeStaffCount,
      },
      inventory: {
        totalValue: Number(totalInventoryValue.toFixed(2)),
        totalFullCylinders: inventory.reduce(
          (sum, inv) => sum + inv.fullCylinders,
          0
        ),
        totalEmptyCylinders: inventory.reduce(
          (sum, inv) => sum + inv.emptyCylinders,
          0
        ),
      },
    };
  }

  // ============================================
  // PROFIT/LOSS REPORT
  // ============================================

  static async getProfitLoss(
    userId: number,
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all sales in period
    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        salesItems: {
          include: {
            cylinderType: true,
          },
        },
      },
    });

    // Calculate revenue
    let totalRevenue = 0;
    const salesDetails = [];

    for (const sale of sales) {
      for (const item of sale.salesItems) {
        const revenue =
          item.quantitySold * Number(item.sellingPricePerCylinder);
        totalRevenue += revenue;

        // Get cost (from latest order)
        const latestOrder = await prisma.orderItem.findFirst({
          where: {
            order: {
              userId: userId,
              orderDate: {
                lte: sale.salesDate,
              },
            },
            cylinderTypeId: item.cylinderTypeId,
          },
          orderBy: {
            order: {
              orderDate: "desc",
            },
          },
          select: {
            pricePerCylinder: true,
          },
        });

        const cost = latestOrder
          ? item.quantitySold * Number(latestOrder.pricePerCylinder)
          : 0;
        const profit = revenue - cost;

        salesDetails.push({
          cylinderType: item.cylinderType,
          quantitySold: item.quantitySold,
          sellingPrice: Number(item.sellingPricePerCylinder),
          costPrice: latestOrder ? Number(latestOrder.pricePerCylinder) : 0,
          revenue: revenue,
          cost: cost,
          profit: profit,
        });
      }
    }

    const totalCost = salesDetails.reduce(
      (sum, detail) => sum + detail.cost,
      0
    );
    const totalProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(2)),
      },
      details: salesDetails,
    };
  }

  // ============================================
  // REVENUE ANALYSIS
  // ============================================

  static async getRevenueAnalysis(
    userId: number,
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Sales revenue
    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        salesItems: true,
      },
    });

    const salesRevenue = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.salesItems.reduce(
          (itemSum, item) =>
            itemSum + item.quantitySold * Number(item.sellingPricePerCylinder),
          0
        )
      );
    }, 0);

    // Revenue by cylinder type
    const cylinderTypeRevenue = new Map();

    for (const sale of sales) {
      for (const item of sale.salesItems) {
        const revenue =
          item.quantitySold * Number(item.sellingPricePerCylinder);
        const existing = cylinderTypeRevenue.get(item.cylinderTypeId) || 0;
        cylinderTypeRevenue.set(item.cylinderTypeId, existing + revenue);
      }
    }

    const cylinderTypes = await prisma.cylinderType.findMany({
      where: {
        id: {
          in: Array.from(cylinderTypeRevenue.keys()),
        },
      },
    });

    const revenueByCylinderType = cylinderTypes
      .map((ct) => ({
        cylinderType: {
          company: ct.company,
          category: ct.typeCategory,
          weight: Number(ct.weightKg),
        },
        revenue: Number((cylinderTypeRevenue.get(ct.id) || 0).toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by staff
    const staffRevenue = new Map();

    for (const sale of sales) {
      const revenue = sale.salesItems.reduce(
        (sum, item) =>
          sum + item.quantitySold * Number(item.sellingPricePerCylinder),
        0
      );
      const existing = staffRevenue.get(sale.staffId) || 0;
      staffRevenue.set(sale.staffId, existing + revenue);
    }

    const staffMembers = await prisma.staff.findMany({
      where: {
        id: {
          in: Array.from(staffRevenue.keys()),
        },
      },
      select: {
        id: true,
        staffName: true,
      },
    });

    const revenueByStaff = staffMembers
      .map((staff) => ({
        staffId: staff.id,
        staffName: staff.staffName,
        revenue: Number((staffRevenue.get(staff.id) || 0).toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      totalRevenue: Number(salesRevenue.toFixed(2)),
      byCylinderType: revenueByCylinderType,
      byStaff: revenueByStaff,
    };
  }

  // ============================================
  // SALES OVERVIEW
  // ============================================

  static async getSalesOverview(
    userId: number,
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        salesItems: {
          include: {
            cylinderType: true,
          },
        },
        staff: {
          select: {
            staffName: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCylindersSold = 0;

    for (const sale of sales) {
      for (const item of sale.salesItems) {
        totalRevenue +=
          item.quantitySold * Number(item.sellingPricePerCylinder);
        totalCylindersSold += item.quantitySold;
      }
    }

    const averageRevenuePerDay =
      sales.length > 0 ? totalRevenue / sales.length : 0;
    const averageCylindersPerDay =
      sales.length > 0 ? totalCylindersSold / sales.length : 0;

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalSalesRecords: sales.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCylindersSold: totalCylindersSold,
        averageRevenuePerDay: Number(averageRevenuePerDay.toFixed(2)),
        averageCylindersPerDay: Number(averageCylindersPerDay.toFixed(2)),
      },
      sales: sales.map((sale) => ({
        date: sale.salesDate,
        staff: sale.staff.staffName,
        revenue: Number(
          sale.salesItems
            .reduce(
              (sum, item) =>
                sum + item.quantitySold * Number(item.sellingPricePerCylinder),
              0
            )
            .toFixed(2)
        ),
        cylindersSold: sale.salesItems.reduce(
          (sum, item) => sum + item.quantitySold,
          0
        ),
      })),
    };
  }

  // ============================================
  // SALES TRENDS
  // ============================================

  static async getSalesTrends(
    userId: number,
    period: "daily" | "weekly" | "monthly" | "yearly",
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        salesItems: true,
      },
    });

    // Group sales by period
    const groupedSales = new Map();

    for (const sale of sales) {
      let key: string;
      const date = new Date(sale.salesDate);

      switch (period) {
        case "daily":
          key = date.toISOString().split("T")[0];
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          break;
        case "yearly":
          key = String(date.getFullYear());
          break;
      }

      const revenue = sale.salesItems.reduce(
        (sum, item) =>
          sum + item.quantitySold * Number(item.sellingPricePerCylinder),
        0
      );

      const cylinders = sale.salesItems.reduce(
        (sum, item) => sum + item.quantitySold,
        0
      );

      const existing = groupedSales.get(key) || {
        revenue: 0,
        cylinders: 0,
        count: 0,
      };
      groupedSales.set(key, {
        revenue: existing.revenue + revenue,
        cylinders: existing.cylinders + cylinders,
        count: existing.count + 1,
      });
    }

    const trends = Array.from(groupedSales.entries())
      .map(([period, data]) => ({
        period,
        revenue: Number(data.revenue.toFixed(2)),
        cylindersSold: data.cylinders,
        salesCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      periodType: period,
      dateRange: {
        startDate: start,
        endDate: end,
      },
      trends,
    };
  }

  // ============================================
  // INVENTORY MOVEMENT
  // ============================================

  static async getInventoryMovement(
    userId: number,
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get adjustments
    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: {
        userId: userId,
        adjustmentDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        cylinderType: {
          select: {
            company: true,
            typeCategory: true,
            weightKg: true,
          },
        },
      },
      orderBy: {
        adjustmentDate: "desc",
      },
    });

    // Get orders (cylinders in)
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        orderDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        distributor: {
          select: {
            distributorName: true,
          },
        },
        orderItems: {
          include: {
            cylinderType: {
              select: {
                company: true,
                typeCategory: true,
                weightKg: true,
              },
            },
          },
        },
      },
    });

    // Get sales (cylinders out)
    const sales = await prisma.dailySales.findMany({
      where: {
        userId: userId,
        salesDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        staff: {
          select: {
            staffName: true,
          },
        },
        salesItems: {
          include: {
            cylinderType: {
              select: {
                company: true,
                typeCategory: true,
                weightKg: true,
              },
            },
          },
        },
      },
    });

    const movements: any[] = [];

    // Add adjustments
    adjustments.forEach((adj) => {
      movements.push({
        type: "adjustment",
        date: adj.adjustmentDate,
        cylinderType: adj.cylinderType,
        fullChange: adj.fullCylinderChange,
        emptyChange: adj.emptyCylinderChange,
        description: adj.reason,
      });
    });

    // Add orders
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        movements.push({
          type: "order",
          date: order.orderDate,
          cylinderType: item.cylinderType,
          fullChange: item.quantity,
          emptyChange: 0,
          description: `Order from ${order.distributor.distributorName}`,
        });
      });
    });

    // Add sales
    sales.forEach((sale) => {
      sale.salesItems.forEach((item) => {
        movements.push({
          type: "sale",
          date: sale.salesDate,
          cylinderType: item.cylinderType,
          fullChange: -item.quantitySold,
          emptyChange: item.quantitySold,
          description: `Sale by ${sale.staff.staffName}`,
        });
      });
    });

    // Sort by date descending
    movements.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      period: {
        startDate: start,
        endDate: end,
      },
      movements,
    };
  }

  // ============================================
  // MONTHLY COMPARISON
  // ============================================

  static async getMonthlyComparison(userId: number, year: number) {
    const months = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Get sales for the month
      const sales = await prisma.dailySales.findMany({
        where: {
          userId: userId,
          salesDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          salesItems: true,
        },
      });

      const revenue = sales.reduce((sum, sale) => {
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

      const cylindersSold = sales.reduce((sum, sale) => {
        return (
          sum +
          sale.salesItems.reduce(
            (itemSum, item) => itemSum + item.quantitySold,
            0
          )
        );
      }, 0);

      months.push({
        month: month + 1,
        monthName: new Date(year, month).toLocaleString("default", {
          month: "long",
        }),
        revenue: Number(revenue.toFixed(2)),
        cylindersSold: cylindersSold,
        salesRecords: sales.length,
      });
    }

    return {
      year,
      months,
    };
  }
}
