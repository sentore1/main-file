-- EMPLOYER CONTRIBUTIONS MIGRATION SQL
-- Run this in phpMyAdmin after backing up your database
-- This adds employer contribution tracking to your HRM system

-- IMPORTANT: Make sure you have selected your database (pryro_rew) in phpMyAdmin before running this!
-- Or uncomment the line below and replace 'pryro_rew' with your actual database name:
-- USE `pryro_rew`;

-- 1. Create employer_contribution_types table
CREATE TABLE IF NOT EXISTS `employer_contribution_types` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employer_contribution_types_created_by_index` (`created_by`),
  CONSTRAINT `employer_contribution_types_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create employer_contributions table
CREATE TABLE IF NOT EXISTS `employer_contributions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employer_contribution_type_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `amount` decimal(10,2) NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employer_contributions_created_by_index` (`created_by`),
  CONSTRAINT `employer_contributions_employer_contribution_type_id_foreign` FOREIGN KEY (`employer_contribution_type_id`) REFERENCES `employer_contribution_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employer_contributions_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employer_contributions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add employer contribution columns to payroll_entries table (only if they don't exist)
SET @dbname = DATABASE();
SET @tablename = 'payroll_entries';
SET @columnname1 = 'total_employer_contributions';
SET @columnname2 = 'employer_contributions_breakdown';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname1)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' DECIMAL(10,2) DEFAULT 0 AFTER total_loans')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname2)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' JSON NULL AFTER loans_breakdown')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Insert migration records so Laravel knows these migrations ran
INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
('2025_11_20_000001_create_employer_contribution_types_table', (SELECT IFNULL(MAX(batch), 0) + 1 FROM (SELECT batch FROM migrations) AS temp)),
('2025_11_20_000002_create_employer_contributions_table', (SELECT IFNULL(MAX(batch), 0) + 1 FROM (SELECT batch FROM migrations) AS temp)),
('2025_11_20_000003_add_employer_contributions_to_payroll_entries', (SELECT IFNULL(MAX(batch), 0) + 1 FROM (SELECT batch FROM migrations) AS temp));

-- Done! Employer contributions feature is now installed.
