-- AlterTable
ALTER TABLE `Content` ADD COLUMN `platform` VARCHAR(30) NULL,
    ADD COLUMN `rating` INTEGER NULL,
    MODIFY `type` ENUM('HERO', 'BLOG', 'GALLERY', 'VIDEO', 'OFFER', 'REVIEW', 'SOCIAL', 'RIDER_PROFILE') NOT NULL;

-- CreateTable
CREATE TABLE `VehicleOil` (
    `id` VARCHAR(191) NOT NULL,
    `make` VARCHAR(80) NOT NULL,
    `model` VARCHAR(120) NOT NULL,
    `variant` VARCHAR(100) NOT NULL DEFAULT 'Nepal market',
    `category` VARCHAR(60) NOT NULL DEFAULT 'Motorcycle',
    `marketSource` VARCHAR(1024) NOT NULL,
    `manualSource` VARCHAR(1024) NULL,
    `viscosity` VARCHAR(80) NULL,
    `specification` VARCHAR(200) NULL,
    `productSlug` VARCHAR(191) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleOil_active_make_idx`(`active`, `make`),
    UNIQUE INDEX `VehicleOil_make_model_variant_key`(`make`, `model`, `variant`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DealershipEnquiry` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `businessName` VARCHAR(180) NOT NULL,
    `address` VARCHAR(300) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `dealershipType` VARCHAR(60) NOT NULL,
    `experience` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `consent` BOOLEAN NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'NEW',
    `adminNotes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DealershipEnquiry_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

