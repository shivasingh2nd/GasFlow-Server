import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS } from "../config/constants";
import { PAGINATION } from "../config/constants";

interface OrderItemInput {
  cylinderTypeId: number;
  quantity: number;
  pricePerCylinder: number;
}

interface CylinderReturnInput {
  cylinderTypeId: number;
  quantity: number;
}

export class OrderService {
  // Create order with items and returns (single transaction)
  static async create(
    userId: number,
    data: {
      distributorId: number;
      orderDate: string;
      deliveryPerson: string;
      items: OrderItemInput[];
      returns?: CylinderReturnInput[];
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

    // Verify all cylinder types exist
    const cylinderTypeIds = [
      ...data.items.map((item) => item.cylinderTypeId),
      ...(data.returns || []).map((ret) => ret.cylinderTypeId),
    ];

    const uniqueCylinderTypeIds = [...new Set(cylinderTypeIds)];

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

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.pricePerCylinder,
      0
    );

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.order.create({
        data: {
          userId: userId,
          distributorId: data.distributorId,
          orderDate: new Date(data.orderDate),
          deliveryPerson: data.deliveryPerson,
          totalAmount: totalAmount,
        },
      });

      // 2. Create order items
      const orderItemsData = data.items.map((item) => ({
        orderId: order.id,
        cylinderTypeId: item.cylinderTypeId,
        quantity: item.quantity,
        pricePerCylinder: item.pricePerCylinder,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // 3. Create cylinder returns (if any)
      if (data.returns && data.returns.length > 0) {
        const returnsData = data.returns.map((ret) => ({
          userId: userId,
          distributorId: data.distributorId,
          cylinderTypeId: ret.cylinderTypeId,
          quantity: ret.quantity,
          returnDate: new Date(data.orderDate),
        }));

        await tx.cylinderReturn.createMany({
          data: returnsData,
        });
      }

      // 4. Update inventory for order items (add full cylinders)
      for (const item of data.items) {
        // Check if inventory exists
        const existingInventory = await tx.inventory.findUnique({
          where: {
            userId_cylinderTypeId: {
              userId: userId,
              cylinderTypeId: item.cylinderTypeId,
            },
          },
        });

        if (existingInventory) {
          // Update existing inventory
          await tx.inventory.update({
            where: {
              userId_cylinderTypeId: {
                userId: userId,
                cylinderTypeId: item.cylinderTypeId,
              },
            },
            data: {
              fullCylinders: {
                increment: item.quantity,
              },
            },
          });
        } else {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              userId: userId,
              cylinderTypeId: item.cylinderTypeId,
              fullCylinders: item.quantity,
              emptyCylinders: 0,
            },
          });
        }
      }

      // 5. Update inventory for returns (reduce empty cylinders)
      if (data.returns && data.returns.length > 0) {
        for (const ret of data.returns) {
          const inventory = await tx.inventory.findUnique({
            where: {
              userId_cylinderTypeId: {
                userId: userId,
                cylinderTypeId: ret.cylinderTypeId,
              },
            },
          });

          if (inventory) {
            // Check if enough empty cylinders to return
            if (inventory.emptyCylinders < ret.quantity) {
              throw new AppError(
                `Insufficient empty cylinders for ${
                  cylinderTypes.find((ct) => ct.id === ret.cylinderTypeId)
                    ?.company
                } ${
                  cylinderTypes.find((ct) => ct.id === ret.cylinderTypeId)
                    ?.typeCategory
                }`,
                HTTP_STATUS.BAD_REQUEST
              );
            }

            await tx.inventory.update({
              where: {
                userId_cylinderTypeId: {
                  userId: userId,
                  cylinderTypeId: ret.cylinderTypeId,
                },
              },
              data: {
                emptyCylinders: {
                  decrement: ret.quantity,
                },
              },
            });
          } else {
            throw new AppError(
              `No inventory found for cylinder type ${ret.cylinderTypeId}`,
              HTTP_STATUS.BAD_REQUEST
            );
          }
        }
      }

      // Return created order with items
      return await tx.order.findUnique({
        where: { id: order.id },
        include: {
          distributor: {
            select: {
              id: true,
              distributorName: true,
              contactNumber: true,
            },
          },
          orderItems: {
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

  // Get all orders for a user (with pagination and filters)
  static async getAllForUser(
    userId: number,
    filters: {
      distributorId?: number;
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

    if (filters.startDate || filters.endDate) {
      where.orderDate = {};
      if (filters.startDate) {
        where.orderDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.orderDate.lte = new Date(filters.endDate);
      }
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order by ID
  static async getById(orderId: number, userId?: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        distributor: {
          select: {
            id: true,
            distributorName: true,
            contactNumber: true,
            address: true,
          },
        },
        orderItems: {
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

    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership if userId provided
    if (userId && order.userId !== userId) {
      throw new AppError(
        "You do not have access to this order",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return order;
  }

  // Get orders by distributor
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

    const total = await prisma.order.count({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
    });

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        distributorId: distributorId,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
      skip,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order items
  static async getOrderItems(orderId: number, userId: number) {
    // Verify order belongs to user
    await this.getById(orderId, userId);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: orderId,
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

    return orderItems;
  }

  // Get cylinder returns for order date and distributor
  static async getReturnsForOrder(orderId: number, userId: number) {
    const order = await this.getById(orderId, userId);

    const returns = await prisma.cylinderReturn.findMany({
      where: {
        userId: userId,
        distributorId: order.distributorId,
        returnDate: order.orderDate,
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

    return returns;
  }

  // Get order summary (order + returns)
  static async getOrderSummary(orderId: number, userId: number) {
    const order = await this.getById(orderId, userId);
    const returns = await this.getReturnsForOrder(orderId, userId);

    return {
      order: {
        id: order.id,
        orderDate: order.orderDate,
        deliveryPerson: order.deliveryPerson,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
      },
      distributor: order.distributor,
      items: order.orderItems.map((item) => ({
        cylinderType: item.cylinderType,
        quantity: item.quantity,
        pricePerCylinder: Number(item.pricePerCylinder),
        subtotal: item.quantity * Number(item.pricePerCylinder),
      })),
      returns: returns.map((ret) => ({
        cylinderType: ret.cylinderType,
        quantity: ret.quantity,
      })),
      summary: {
        totalItems: order.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        totalReturns: returns.reduce((sum, ret) => sum + ret.quantity, 0),
        totalAmount: Number(order.totalAmount),
      },
    };
  }
}
