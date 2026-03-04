-- AlterTable
ALTER TABLE `computer` ADD COLUMN `gpu` VARCHAR(191) NULL,
    ADD COLUMN `osVersion` VARCHAR(191) NULL,
    ADD COLUMN `processor` VARCHAR(191) NULL,
    ADD COLUMN `ram` VARCHAR(191) NULL,
    ADD COLUMN `storageSize` VARCHAR(191) NULL,
    ADD COLUMN `storageType` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `laboratory` ADD COLUMN `building` VARCHAR(191) NULL,
    ADD COLUMN `scheduleClass` VARCHAR(191) NULL,
    ADD COLUMN `scheduleDay` VARCHAR(191) NULL,
    ADD COLUMN `scheduleSubjectCode` VARCHAR(191) NULL,
    ADD COLUMN `scheduleTimeSlot` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `LabSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `laboratoryId` INTEGER NOT NULL,
    `day` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `instructorId` INTEGER NOT NULL,
    `className` VARCHAR(191) NOT NULL,
    `subjectCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComputerSoftware` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `computerId` INTEGER NOT NULL,
    `softwareName` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NULL,
    `installedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ComputerSoftware_computerId_softwareName_key`(`computerId`, `softwareName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LabSchedule` ADD CONSTRAINT `LabSchedule_laboratoryId_fkey` FOREIGN KEY (`laboratoryId`) REFERENCES `Laboratory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabSchedule` ADD CONSTRAINT `LabSchedule_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComputerSoftware` ADD CONSTRAINT `ComputerSoftware_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
