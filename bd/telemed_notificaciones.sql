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
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id_notificaciones` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `tipo_notificacion` varchar(50) DEFAULT NULL,
  `mensaje` varchar(500) DEFAULT NULL,
  `leido` tinyint(1) DEFAULT '0',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificaciones`),
  KEY `idx_notif_id_usuario` (`id_usuario`),
  KEY `idx_notif_usuario_leido_fecha` (`id_usuario`,`leido`,`creado_en`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,1,'Bienvenida','¡Hola Mariana López! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(2,2,'Bienvenida','¡Hola Carlos Méndez! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(3,3,'Bienvenida','¡Hola Ana Rivera! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(4,4,'Bienvenida','¡Hola Javier Torres! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(5,5,'Bienvenida','¡Hola Sofía García! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(6,6,'Bienvenida','¡Hola Luis Fernández! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(7,7,'Bienvenida','¡Hola Martín Pérez! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(8,8,'Bienvenida','¡Hola Valeria Ortiz! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(9,9,'Bienvenida','¡Hola Diego Hernández! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(10,10,'Bienvenida','¡Hola Lucía Martínez! Te damos la bienvenida a TeleMed.',0,'2025-11-06 20:36:29'),(11,9,'Consulta completada','Tu consulta (Cita ID: 1005) ha finalizado. Revisa tus notas y recetas.',0,'2025-11-06 20:36:59'),(12,2,'Consulta registrada','Se ha registrado correctamente la consulta para la cita ID: 1005.',0,'2025-11-06 20:36:59'),(13,10,'Consulta completada','Tu consulta (Cita ID: 1006) ha finalizado. Revisa tus notas y recetas.',0,'2025-11-06 20:36:59'),(14,4,'Consulta registrada','Se ha registrado correctamente la consulta para la cita ID: 1006.',0,'2025-11-06 20:36:59'),(15,6,'Consulta completada','Tu consulta (Cita ID: 1002) ha finalizado. Revisa tus notas y recetas.',0,'2025-11-06 20:36:59'),(16,3,'Consulta registrada','Se ha registrado correctamente la consulta para la cita ID: 1002.',0,'2025-11-06 20:36:59'),(7001,1,'AvisoSistema','La base de datos TeleMed fue creada y configurada.',1,'2025-09-01 09:05:00'),(7002,5,'Recordatorio','Tienes una cita programada el 2025-10-01 a las 09:00.',0,'2025-09-29 08:00:00'),(7003,2,'NuevoPaciente','Se ha registrado un nuevo paciente: Sofía García.',0,'2025-09-10 14:10:00'),(7004,9,'Informe','Tu consulta del 20/09 quedó registrada. Revisa tu expediente.',0,'2025-09-20 17:05:00'),(7005,9,'Bienvenida','¡Hola Diego Hernández! Te damos la bienvenida a TeleMed.',0,'2025-09-22 19:06:00');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-06 20:42:29
