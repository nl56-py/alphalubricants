-- Bring earlier DirectAdmin databases up to the current application schema.
ALTER TABLE `User`
  ADD COLUMN `image` VARCHAR(1024) NULL,
  ADD COLUMN `bio` TEXT NULL;

ALTER TABLE `Order`
  MODIFY `userId` VARCHAR(191) NULL,
  ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `guestName` VARCHAR(120) NULL,
  ADD COLUMN `guestPhone` VARCHAR(30) NULL,
  ADD COLUMN `guestAddress` VARCHAR(500) NULL;

ALTER TABLE `Content`
  ADD COLUMN `mobileImage` VARCHAR(1024) NULL;

ALTER TABLE `DealershipEnquiry`
  MODIFY `email` VARCHAR(191) NULL,
  ADD COLUMN `businessPhone` VARCHAR(30) NULL,
  MODIFY `district` VARCHAR(100) NULL,
  MODIFY `dealershipType` VARCHAR(60) NULL,
  MODIFY `experience` VARCHAR(100) NULL,
  MODIFY `message` TEXT NULL,
  MODIFY `consent` BOOLEAN NOT NULL DEFAULT true,
  MODIFY `adminNotes` TEXT NULL;
