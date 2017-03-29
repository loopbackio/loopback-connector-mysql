-- MySQL dump 10.13  Distrib 5.7.14, for osx10.10 (x86_64)
--
-- Host: 166.78.158.45    Database: STRONGLOOP
-- ------------------------------------------------------
-- Server version	5.1.69

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `STRONGLOOP`
--

/*!40000 DROP DATABASE IF EXISTS `STRONGLOOP`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `STRONGLOOP` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `STRONGLOOP`;

--
-- Table structure for table `CUSTOMER`
--

DROP TABLE IF EXISTS `CUSTOMER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CUSTOMER` (
  `ID` varchar(20) NOT NULL,
  `NAME` varchar(40) DEFAULT NULL,
  `MILITARY_AGENCY` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CUSTOMER`
--

LOCK TABLES `CUSTOMER` WRITE;
/*!40000 ALTER TABLE `CUSTOMER` DISABLE KEYS */;
/*!40000 ALTER TABLE `CUSTOMER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `INVENTORY`
--

DROP TABLE IF EXISTS `INVENTORY`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `INVENTORY` (
  `PRODUCT_ID` varchar(20) NOT NULL,
  `LOCATION_ID` varchar(20) NOT NULL,
  `AVAILABLE` int(11) DEFAULT NULL,
  `TOTAL` int(11) DEFAULT NULL,
  `ACTIVE` BOOLEAN DEFAULT TRUE,
  `DISABLED` BIT(1) DEFAULT 0,
  `ENABLED` CHAR(1) DEFAULT 'Y',
  PRIMARY KEY (`PRODUCT_ID`,`LOCATION_ID`),
  KEY `LOCATION_FK` (`LOCATION_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `INVENTORY`
--

LOCK TABLES `INVENTORY` WRITE;
/*!40000 ALTER TABLE `INVENTORY` DISABLE KEYS */;
/*!40000 ALTER TABLE `INVENTORY` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `INVENTORY_VIEW`
--

DROP TABLE IF EXISTS `INVENTORY_VIEW`;
/*!50001 DROP VIEW IF EXISTS `INVENTORY_VIEW`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `INVENTORY_VIEW` AS SELECT
 1 AS `ID`,
 1 AS `PRODUCT_ID`,
 1 AS `PRODUCT_NAME`,
 1 AS `AUDIBLE_RANGE`,
 1 AS `EFFECTIVE_RANGE`,
 1 AS `ROUNDS`,
 1 AS `EXTRAS`,
 1 AS `FIRE_MODES`,
 1 AS `LOCATION_ID`,
 1 AS `LOCATION`,
 1 AS `CITY`,
 1 AS `ZIPCODE`,
 1 AS `AVAILABLE`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `LOCATION`
--

DROP TABLE IF EXISTS `LOCATION`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `LOCATION` (
  `ID` varchar(20) NOT NULL,
  `STREET` varchar(20) DEFAULT NULL,
  `CITY` varchar(20) DEFAULT NULL,
  `ZIPCODE` varchar(20) DEFAULT NULL,
  `NAME` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LOCATION`
--

LOCK TABLES `LOCATION` WRITE;
/*!40000 ALTER TABLE `LOCATION` DISABLE KEYS */;
/*!40000 ALTER TABLE `LOCATION` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PRODUCT`
--

DROP TABLE IF EXISTS `PRODUCT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PRODUCT` (
  `ID` varchar(20) NOT NULL,
  `NAME` varchar(64) DEFAULT NULL,
  `AUDIBLE_RANGE` decimal(12,2) DEFAULT NULL,
  `EFFECTIVE_RANGE` decimal(12,2) DEFAULT NULL,
  `ROUNDS` decimal(10,0) DEFAULT NULL,
  `EXTRAS` varchar(64) DEFAULT NULL,
  `FIRE_MODES` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PRODUCT`
--

LOCK TABLES `PRODUCT` WRITE;
/*!40000 ALTER TABLE `PRODUCT` DISABLE KEYS */;
/*!40000 ALTER TABLE `PRODUCT` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RESERVATION`
--

DROP TABLE IF EXISTS `RESERVATION`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RESERVATION` (
  `ID` varchar(20) NOT NULL,
  `PRODUCT_ID` varchar(20) NOT NULL,
  `LOCATION_ID` varchar(20) NOT NULL,
  `CUSTOMER_ID` varchar(20) NOT NULL,
  `QTY` int(11) DEFAULT NULL,
  `STATUS` varchar(20) DEFAULT NULL,
  `RESERVE_DATE` date DEFAULT NULL,
  `PICKUP_DATE` date DEFAULT NULL,
  `RETURN_DATE` date DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `RESERVATION_PRODUCT_FK` (`PRODUCT_ID`),
  KEY `RESERVATION_LOCATION_FK` (`LOCATION_ID`),
  KEY `RESERVATION_CUSTOMER_FK` (`CUSTOMER_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RESERVATION`
--

LOCK TABLES `RESERVATION` WRITE;
/*!40000 ALTER TABLE `RESERVATION` DISABLE KEYS */;
/*!40000 ALTER TABLE `RESERVATION` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TESTGEN`
--

DROP TABLE IF EXISTS `TESTGEN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `TESTGEN` (
  `ID` int(11) NOT NULL  AUTO_INCREMENT,
  `NAME` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Current Database: `STRONGLOOP`
--

USE `STRONGLOOP`;

--
-- Final view structure for view `INVENTORY_VIEW`
--

/*!50001 DROP VIEW IF EXISTS `INVENTORY_VIEW`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`strongloop`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `INVENTORY_VIEW` AS select concat(concat(`P`.`ID`,':'),`L`.`ID`) AS `ID`,`P`.`ID` AS `PRODUCT_ID`,`P`.`NAME` AS `PRODUCT_NAME`,`P`.`AUDIBLE_RANGE` AS `AUDIBLE_RANGE`,`P`.`EFFECTIVE_RANGE` AS `EFFECTIVE_RANGE`,`P`.`ROUNDS` AS `ROUNDS`,`P`.`EXTRAS` AS `EXTRAS`,`P`.`FIRE_MODES` AS `FIRE_MODES`,`L`.`ID` AS `LOCATION_ID`,`L`.`NAME` AS `LOCATION`,`L`.`CITY` AS `CITY`,`L`.`ZIPCODE` AS `ZIPCODE`,`I`.`AVAILABLE` AS `AVAILABLE` from ((`INVENTORY` `I` join `PRODUCT` `P`) join `LOCATION` `L`) where ((`P`.`ID` = `I`.`PRODUCT_ID`) and (`L`.`ID` = `I`.`LOCATION_ID`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-08-09 19:14:01
