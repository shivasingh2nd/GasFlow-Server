import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";

interface OpeningStockItem {
  cylinderTypeId: number;
  fullCylinders: number;
  emptyCylinders: number;
}

export class InventoryService {
  // Get all inventory for user
  static async getAllForUser(
    userId: number,
    filters?: {
      cylinderTypeId?: number;
      company?: string;
      lowStock?: boolean;
      threshold?: number;
    }
  ) {
    const where: any = {
      userId: userId,
    };

    if (filters?.cylinderTypeId) {
      where.cylinderTypeId = filters.cylinderTypeId;
    }

    if (filters?.company) {
      where.cylinderType = {
        company: filters.company,
      };
    }

    let inventory = await prisma.inventory.findMany({
      where,
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
      orderBy: [
        { cylinderType: { company: "asc" } },
        { cylinderType: { weightKg: "asc" } },
      ],
    });

    // Apply low stock filter if needed
    if (filters?.lowStock) {
      const threshold = filters.threshold || 10;
      inventory = inventory.filter((inv) => inv.fullCylinders < threshold);
    }

    return inventory.map((inv) => ({
      id: inv.id,
      cylinderType: {
        id: inv.cylinderType.id,
        company: inv.cylinderType.company,
        category: inv.cylinderType.typeCategory,
        weight: Number(inv.cylinderType.weightKg),
        display: `${inv.cylinderType.company} ${inv.cylinderType.typeCategory} ${inv.cylinderType.weightKg}kg`,
      },
      fullCylinders: inv.fullCylinders,
      emptyCylinders: inv.emptyCylinders,
      totalCylinders: inv.fullCylinders + inv.emptyCylinders,
      lastUpdated: inv.lastUpdated,
    }));
  }

  // Get inventory summary
  static async getSummary(userId: number) {
    const inventory = await prisma.inventory.findMany({
      where: { userId: userId },
      include: {
        cylinderType: true,
      },
    });

    const totalFull = inventory.reduce(
      (sum, inv) => sum + inv.fullCylinders,
      0
    );
    const totalEmpty = inventory.reduce(
      (sum, inv) => sum + inv.emptyCylinders,
      0
    );
    const totalCylinders = totalFull + totalEmpty;

    // Group by company
    const byCompany = inventory.reduce((acc, inv) => {
      const company = inv.cylinderType.company;
      if (!acc[company]) {
        acc[company] = { full: 0, empty: 0, total: 0 };
      }
      acc[company].full += inv.fullCylinders;
      acc[company].empty += inv.emptyCylinders;
      acc[company].total += inv.fullCylinders + inv.emptyCylinders;
      return acc;
    }, {} as Record<string, { full: number; empty: number; total: number }>);

    // Low stock items (less than 10 full)
    const lowStockItems = inventory
      .filter((inv) => inv.fullCylinders < 10)
      .map((inv) => ({
        cylinderType: {
          id: inv.cylinderType.id,
          company: inv.cylinderType.company,
          category: inv.cylinderType.typeCategory,
          weight: Number(inv.cylinderType.weightKg),
        },
        fullCylinders: inv.fullCylinders,
      }));

    return {
      summary: {
        totalFull,
        totalEmpty,
        totalCylinders,
      },
      byCompany,
      lowStockCount: lowStockItems.length,
      lowStockItems,
    };
  }

  // Get inventory for specific cylinder type
  static async getByCylinderType(userId: number, cylinderTypeId: number) {
    // Verify cylinder type exists
    const cylinderType = await prisma.cylinderType.findUnique({
      where: { id: cylinderTypeId },
    });

    if (!cylinderType) {
      throw new AppError("Cylinder type not found", HTTP_STATUS.NOT_FOUND);
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        userId_cylinderTypeId: {
          userId: userId,
          cylinderTypeId: cylinderTypeId,
        },
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
    });

    if (!inventory) {
      // Return zero inventory if not found
      return {
        cylinderType: {
          id: cylinderType.id,
          company: cylinderType.company,
          category: cylinderType.typeCategory,
          weight: Number(cylinderType.weightKg),
        },
        fullCylinders: 0,
        emptyCylinders: 0,
        totalCylinders: 0,
        lastUpdated: null,
      };
    }

    return {
      id: inventory.id,
      cylinderType: {
        id: inventory.cylinderType.id,
        company: inventory.cylinderType.company,
        category: inventory.cylinderType.typeCategory,
        weight: Number(inventory.cylinderType.weightKg),
      },
      fullCylinders: inventory.fullCylinders,
      emptyCylinders: inventory.emptyCylinders,
      totalCylinders: inventory.fullCylinders + inventory.emptyCylinders,
      lastUpdated: inventory.lastUpdated,
    };
  }

  // Set opening stock (first time setup)
  static async setOpeningStock(
    userId: number,
    data: {
      items: OpeningStockItem[];
      openingDate: string;
    }
  ) {
    // Check if opening stock already exists
    const existingInventory = await prisma.inventory.findFirst({
      where: { userId: userId },
    });

    if (existingInventory) {
      throw new AppError(
        "Opening stock already set. Use adjustments to modify inventory.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify all cylinder types exist
    const cylinderTypeIds = data.items.map((item) => item.cylinderTypeId);
    const cylinderTypes = await prisma.cylinderType.findMany({
      where: { id: { in: cylinderTypeIds } },
    });

    if (cylinderTypes.length !== cylinderTypeIds.length) {
      throw new AppError(
        "One or more cylinder types not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Create opening stock in transaction
    return await prisma.$transaction(async (tx) => {
      const createdInventory = [];

      for (const item of data.items) {
        // Create inventory record
        const inventory = await tx.inventory.create({
          data: {
            userId: userId,
            cylinderTypeId: item.cylinderTypeId,
            fullCylinders: item.fullCylinders,
            emptyCylinders: item.emptyCylinders,
          },
        });

        // Create adjustment record for audit trail
        await tx.inventoryAdjustment.create({
          data: {
            userId: userId,
            cylinderTypeId: item.cylinderTypeId,
            fullCylinderChange: item.fullCylinders,
            emptyCylinderChange: item.emptyCylinders,
            reason: "Opening Stock - Business Registration",
            adjustmentDate: new Date(data.openingDate),
          },
        });

        createdInventory.push(inventory);
      }

      return createdInventory;
    });
  }

  // Create inventory adjustment
  static async createAdjustment(
    userId: number,
    data: {
      cylinderTypeId: number;
      fullCylinderChange: number;
      emptyCylinderChange: number;
      reason: string;
      adjustmentDate: string;
    }
  ) {
    // Verify cylinder type exists
    const cylinderType = await prisma.cylinderType.findUnique({
      where: { id: data.cylinderTypeId },
    });

    if (!cylinderType) {
      throw new AppError("Cylinder type not found", HTTP_STATUS.NOT_FOUND);
    }

    // Get current inventory
    let inventory = await prisma.inventory.findUnique({
      where: {
        userId_cylinderTypeId: {
          userId: userId,
          cylinderTypeId: data.cylinderTypeId,
        },
      },
    });

    // If inventory doesn't exist, create it
    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          userId: userId,
          cylinderTypeId: data.cylinderTypeId,
          fullCylinders: 0,
          emptyCylinders: 0,
        },
      });
    }

    // Calculate new values
    const newFullCylinders = inventory.fullCylinders + data.fullCylinderChange;
    const newEmptyCylinders =
      inventory.emptyCylinders + data.emptyCylinderChange;

    // Validate non-negative inventory
    if (newFullCylinders < 0) {
      throw new AppError(
        `Adjustment would result in negative full cylinders (current: ${inventory.fullCylinders}, change: ${data.fullCylinderChange})`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (newEmptyCylinders < 0) {
      throw new AppError(
        `Adjustment would result in negative empty cylinders (current: ${inventory.emptyCylinders}, change: ${data.emptyCylinderChange})`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create adjustment and update inventory in transaction
    return await prisma.$transaction(async (tx) => {
      // Create adjustment record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          userId: userId,
          cylinderTypeId: data.cylinderTypeId,
          fullCylinderChange: data.fullCylinderChange,
          emptyCylinderChange: data.emptyCylinderChange,
          reason: data.reason,
          adjustmentDate: new Date(data.adjustmentDate),
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
      });

      // Update inventory
      await tx.inventory.update({
        where: {
          userId_cylinderTypeId: {
            userId: userId,
            cylinderTypeId: data.cylinderTypeId,
          },
        },
        data: {
          fullCylinders: newFullCylinders,
          emptyCylinders: newEmptyCylinders,
        },
      });

      return adjustment;
    });
  }

  // Get adjustment history
  static async getAdjustments(
    userId: number,
    filters?: {
      cylinderTypeId?: number;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: userId,
    };

    if (filters?.cylinderTypeId) {
      where.cylinderTypeId = filters.cylinderTypeId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.adjustmentDate = {};
      if (filters.startDate) {
        where.adjustmentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.adjustmentDate.lte = new Date(filters.endDate);
      }
    }

    const total = await prisma.inventoryAdjustment.count({ where });

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where,
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
        adjustmentDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      adjustments: adjustments.map((adj) => ({
        id: adj.id,
        cylinderType: {
          id: adj.cylinderType.id,
          company: adj.cylinderType.company,
          category: adj.cylinderType.typeCategory,
          weight: Number(adj.cylinderType.weightKg),
        },
        fullCylinderChange: adj.fullCylinderChange,
        emptyCylinderChange: adj.emptyCylinderChange,
        reason: adj.reason,
        adjustmentDate: adj.adjustmentDate,
        createdAt: adj.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get low stock items
  static async getLowStock(userId: number, threshold: number = 10) {
    const inventory = await prisma.inventory.findMany({
      where: {
        userId: userId,
        fullCylinders: {
          lt: threshold,
        },
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
        fullCylinders: "asc",
      },
    });

    return inventory.map((inv) => ({
      cylinderType: {
        id: inv.cylinderType.id,
        company: inv.cylinderType.company,
        category: inv.cylinderType.typeCategory,
        weight: Number(inv.cylinderType.weightKg),
        display: `${inv.cylinderType.company} ${inv.cylinderType.typeCategory} ${inv.cylinderType.weightKg}kg`,
      },
      fullCylinders: inv.fullCylinders,
      emptyCylinders: inv.emptyCylinders,
      threshold: threshold,
      stockLevel: inv.fullCylinders === 0 ? "out_of_stock" : "low_stock",
    }));
  }

  // Get inventory movements (combined view)
  static async getMovements(
    userId: number,
    filters?: {
      cylinderTypeId?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) {
    const limit = filters?.limit || 50;

    // Build date filter
    const dateFilter: any = {};
    if (filters?.startDate || filters?.endDate) {
      if (filters.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.lte = new Date(filters.endDate);
      }
    }

    const cylinderTypeFilter = filters?.cylinderTypeId
      ? { cylinderTypeId: filters.cylinderTypeId }
      : {};

    // Get adjustments
    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: {
        userId: userId,
        ...cylinderTypeFilter,
        ...(Object.keys(dateFilter).length > 0 && {
          adjustmentDate: dateFilter,
        }),
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
        adjustmentDate: "desc",
      },
      take: limit,
    });

    // Get recent orders (from ORDER table)
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        ...(Object.keys(dateFilter).length > 0 && { orderDate: dateFilter }),
      },
      include: {
        distributor: {
          select: {
            distributorName: true,
          },
        },
        orderItems: {
          where: cylinderTypeFilter,
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
        orderDate: "desc",
      },
      take: limit,
    });

    // Format movements
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
        createdAt: adj.createdAt,
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
          createdAt: order.createdAt,
        });
      });
    });

    // Sort by date descending
    movements.sort((a, b) => b.date.getTime() - a.date.getTime());

    return movements.slice(0, limit);
  }

  // Get inventory valuation (approximate)
  static async getValuation(userId: number) {
    const inventory = await prisma.inventory.findMany({
      where: { userId: userId },
      include: {
        cylinderType: true,
      },
    });

    // Get latest purchase prices from orders
    const valuations = await Promise.all(
      inventory.map(async (inv) => {
        // Get latest order item for this cylinder type
        const latestOrderItem = await prisma.orderItem.findFirst({
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

        const pricePerCylinder = latestOrderItem
          ? Number(latestOrderItem.pricePerCylinder)
          : 0;

        const fullValue = inv.fullCylinders * pricePerCylinder;

        return {
          cylinderType: {
            id: inv.cylinderType.id,
            company: inv.cylinderType.company,
            category: inv.cylinderType.typeCategory,
            weight: Number(inv.cylinderType.weightKg),
          },
          fullCylinders: inv.fullCylinders,
          emptyCylinders: inv.emptyCylinders,
          pricePerCylinder,
          fullValue,
        };
      })
    );

    const totalValue = valuations.reduce((sum, v) => sum + v.fullValue, 0);

    return {
      items: valuations,
      totalValue,
    };
  }
}
