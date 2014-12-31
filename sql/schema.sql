-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.6.14-log - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             8.1.0.4545
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping database structure for genescripts
CREATE DATABASE IF NOT EXISTS `genescripts` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `genescripts`;


-- Dumping structure for table genescripts.exons
CREATE TABLE IF NOT EXISTS `exons` (
  `transcript_id` varchar(50) NOT NULL,
  `start` int(11) NOT NULL,
  `end` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.


-- Dumping structure for table genescripts.genes
CREATE TABLE IF NOT EXISTS `genes` (
  `species_id` smallint(5) unsigned NOT NULL,
  `gene_id` varchar(50) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `region` varchar(50) NOT NULL,
  `start` int(10) unsigned NOT NULL,
  `end` int(10) unsigned NOT NULL,
  `strand` tinyint(4) NOT NULL,
  `transcript_id` varchar(50) NOT NULL,
  `start3utr` int(10) unsigned DEFAULT NULL,
  `end3utr` int(10) unsigned DEFAULT NULL,
  `startcds` int(10) unsigned DEFAULT NULL,
  `endcds` int(10) unsigned DEFAULT NULL,
  `start5utr` int(10) unsigned DEFAULT NULL,
  `end5utr` int(10) unsigned DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.


-- Dumping structure for table genescripts.species
CREATE TABLE IF NOT EXISTS `species` (
  `species_id` smallint(5) unsigned NOT NULL,
  `taxon` mediumint(8) unsigned NOT NULL,
  `name` tinytext NOT NULL,
  `assembly` tinytext NOT NULL,
  `label` tinytext NOT NULL,
  PRIMARY KEY (`species_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
