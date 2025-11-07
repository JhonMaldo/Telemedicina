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
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(150) NOT NULL,
  `corre_electronico` varchar(150) NOT NULL,
  `contrasenia_hash` varchar(255) NOT NULL,
  `role` enum('Administrador','Doctor','Paciente') NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Activo','Inactivo','Suspendido') DEFAULT 'Activo',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `corre_electronico` (`corre_electronico`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Mariana López','mariana.lopez@admin.com','$2y$10$hash_admin1','Administrador','2025-09-01 09:00:00','Activo'),(2,'Carlos Méndez','carlos.mendez@clinica.com','$2y$10$hash_doc1','Doctor','2025-09-02 10:15:00','Activo'),(3,'Ana Rivera','ana.rivera@clinica.com','$2y$10$hash_doc2','Doctor','2025-09-02 10:20:00','Activo'),(4,'Javier Torres','javier.torres@clinica.com','$2y$10$hash_doc3','Doctor','2025-09-05 08:45:00','Activo'),(5,'Sofía García','sofia.garcia@gmail.com','$2y$10$hash_pac1','Paciente','2025-09-10 14:00:00','Activo'),(6,'Luis Fernández','luis.fernandezg@mail.com','$2y$10$hash_pac2','Paciente','2025-09-12 11:30:00','Activo'),(7,'Martín Pérez','martin.perez@gmail.com','$2y$10$hash_pac3','Paciente','2025-09-15 16:45:00','Activo'),(8,'Valeria Ortiz','valeria.ortiz@gmail.com','$2y$10$hash_pac4','Paciente','2025-09-20 09:10:00','Activo'),(9,'Diego Hernández','diego.hernandez@gmail.com','$2y$10$hash_pac5','Paciente','2025-09-22 19:05:00','Activo'),(10,'Lucía Martínez','lucia.martinez@gmail.com','$2y$10$hash_pac6','Paciente','2025-09-25 07:55:00','Activo');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
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
