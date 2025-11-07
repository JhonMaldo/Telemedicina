-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: telemed
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id_citas` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `id_doctor` int NOT NULL,
  `fecha_programada` datetime NOT NULL,
  `duracion_en_minutos` int DEFAULT '30',
  `type` enum('virtual','en_persona') DEFAULT 'virtual',
  `status` enum('programado','completada','cancelada','no_llegó') DEFAULT 'programado',
  `razon` varchar(255) DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_citas`),
  KEY `idx_citas_id_paciente` (`id_paciente`),
  KEY `idx_citas_id_doctor` (`id_doctor`),
  KEY `idx_citas_doctor_fecha` (`id_doctor`,`fecha_programada`),
  KEY `idx_citas_status_fecha` (`status`,`fecha_programada`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id_paciente`) ON DELETE CASCADE,
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`id_doctor`) REFERENCES `doctores` (`id_doctor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1009 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (1001,201,101,'2025-10-01 09:00:00',30,'virtual','programado','Chequeo cardiológico anual','2025-09-28 12:00:00'),(1002,202,102,'2025-10-01 10:00:00',30,'en_persona','completada','Consulta por tos persistente','2025-09-29 09:15:00'),(1003,203,102,'2025-10-02 11:00:00',45,'virtual','programado','Control pediátrico','2025-09-30 14:40:00'),(1004,204,103,'2025-10-03 15:30:00',30,'virtual','programado','Dolor lumbar','2025-10-01 08:20:00'),(1005,205,101,'2025-09-20 16:00:00',30,'en_persona','completada','Mareo y palpitaciones','2025-09-18 11:00:00'),(1006,206,103,'2025-09-22 09:30:00',30,'en_persona','completada','Chequeo general','2025-09-20 10:10:00'),(1007,201,103,'2025-10-05 09:30:00',60,'en_persona','cancelada','Rehabilitación por esguince','2025-09-30 09:00:00'),(1008,202,101,'2025-10-06 14:00:00',30,'virtual','programado','Segunda opinión cardiológica','2025-10-01 10:00:00');
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-06 20:42:28
