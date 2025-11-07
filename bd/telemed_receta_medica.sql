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
-- Table structure for table `receta_medica`
--

DROP TABLE IF EXISTS `receta_medica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receta_medica` (
  `id_receta_medica` int NOT NULL AUTO_INCREMENT,
  `id_consulta` int DEFAULT NULL,
  `id_doctor` int DEFAULT NULL,
  `id_paciente` int DEFAULT NULL,
  `la_receta` text,
  `url_pdf` varchar(255) DEFAULT NULL,
  `fecha_emision` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_receta_medica`),
  KEY `id_consulta` (`id_consulta`),
  KEY `idx_receta_id_doctor` (`id_doctor`),
  KEY `idx_receta_id_paciente` (`id_paciente`),
  CONSTRAINT `receta_medica_ibfk_1` FOREIGN KEY (`id_consulta`) REFERENCES `consultas` (`id_consulta`) ON DELETE SET NULL,
  CONSTRAINT `receta_medica_ibfk_2` FOREIGN KEY (`id_doctor`) REFERENCES `doctores` (`id_doctor`) ON DELETE SET NULL,
  CONSTRAINT `receta_medica_ibfk_3` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id_paciente`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receta_medica`
--

LOCK TABLES `receta_medica` WRITE;
/*!40000 ALTER TABLE `receta_medica` DISABLE KEYS */;
INSERT INTO `receta_medica` VALUES (4001,3001,101,205,'Reposo relativo, omeprazol 20 mg 1 vez al día por 4 semanas.','https://docs.telemed/recetas/4001.pdf','2025-09-20 17:00:00'),(4002,3003,102,202,'Jarabe expectorante 10 ml cada 8 horas por 5 días. Hidratación frecuente.','https://docs.telemed/recetas/4002.pdf','2025-10-01 10:30:00'),(4003,3002,103,206,'Multivitamínico diario durante un mes. Control en 6 meses.','https://docs.telemed/recetas/4003.pdf','2025-09-22 10:05:00');
/*!40000 ALTER TABLE `receta_medica` ENABLE KEYS */;
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
