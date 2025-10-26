-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile_number` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_mobile_number_key`(`mobile_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distributors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `distributor_name` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cylinder_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company` ENUM('HPCL', 'IOCL', 'BPCL') NOT NULL,
    `type_category` ENUM('Domestic', 'Commercial') NOT NULL,
    `weight_kg` DECIMAL(5, 2) NOT NULL,
    `is_discontinued` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cylinder_types_company_type_category_weight_kg_key`(`company`, `type_category`, `weight_kg`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `full_cylinders` INTEGER NOT NULL DEFAULT 0,
    `empty_cylinders` INTEGER NOT NULL DEFAULT 0,
    `last_updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_user_id_cylinder_type_id_key`(`user_id`, `cylinder_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `distributor_id` INTEGER NOT NULL,
    `order_date` DATE NOT NULL,
    `delivery_person` VARCHAR(191) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price_per_cylinder` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cylinder_returns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `distributor_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `return_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `distributor_id` INTEGER NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,
    `payment_date` DATE NOT NULL,
    `payment_method` ENUM('Cash', 'UPI', 'Card', 'Cheque', 'BankTransfer', 'Other') NOT NULL DEFAULT 'Cash',
    `transaction_reference` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `staff_name` VARCHAR(191) NOT NULL,
    `mobile_number` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `sales_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sales_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity_sold` INTEGER NOT NULL,
    `selling_price_per_cylinder` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_adjustments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `full_cylinder_change` INTEGER NOT NULL,
    `empty_cylinder_change` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `adjustment_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_customer_name_phone_number_key`(`customer_name`, `phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_cylinder_loans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity_loaned` INTEGER NOT NULL,
    `loan_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_cylinder_returns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity_returned` INTEGER NOT NULL,
    `return_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empty_received_on_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sales_id` INTEGER NOT NULL,
    `cylinder_type_id` INTEGER NOT NULL,
    `quantity_received` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cylinder_returns` ADD CONSTRAINT `cylinder_returns_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cylinder_returns` ADD CONSTRAINT `cylinder_returns_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cylinder_returns` ADD CONSTRAINT `cylinder_returns_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_sales` ADD CONSTRAINT `daily_sales_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_sales` ADD CONSTRAINT `daily_sales_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_items` ADD CONSTRAINT `sales_items_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `daily_sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_items` ADD CONSTRAINT `sales_items_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_cylinder_loans` ADD CONSTRAINT `customer_cylinder_loans_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_cylinder_loans` ADD CONSTRAINT `customer_cylinder_loans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_cylinder_loans` ADD CONSTRAINT `customer_cylinder_loans_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_cylinder_returns` ADD CONSTRAINT `loan_cylinder_returns_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_cylinder_returns` ADD CONSTRAINT `loan_cylinder_returns_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_cylinder_returns` ADD CONSTRAINT `loan_cylinder_returns_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empty_received_on_sales` ADD CONSTRAINT `empty_received_on_sales_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `daily_sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empty_received_on_sales` ADD CONSTRAINT `empty_received_on_sales_cylinder_type_id_fkey` FOREIGN KEY (`cylinder_type_id`) REFERENCES `cylinder_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
