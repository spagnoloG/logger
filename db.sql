CREATE DATABASE `logger` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
CREATE USER  'dev'@'localhost' IDENTIFIED BY 'dev';
FLUSH PRIVILEGES;
GRANT ALL PRIVILEGES ON *.* TO 'dev'@'%' IDENTIFIED BY 'dev' WITH GRANT OPTION;


-- logger.`user` definition

CREATE TABLE `user` (
  `Name` varchar(100) NOT NULL,
  `User_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `Password` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Role` varchar(100) NOT NULL,
  `Key_id` varchar(100) DEFAULT NULL,
  `Profile_picture` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`User_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- logger.unknown_transcation definition

CREATE TABLE `unknown_transcation` (
  `Key_id` varchar(100) NOT NULL,
  `Timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `Transaction_id` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`Transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- logger.`transaction` definition

CREATE TABLE `transaction` (
  `Transaction_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `User_id` bigint(20) NOT NULL,
  `Timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Transaction_id`),
  KEY `transaction_FK` (`User_id`),
  CONSTRAINT `transaction_FK` FOREIGN KEY (`User_id`) REFERENCES `user` (`User_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- logger.conflict definition

CREATE TABLE `conflict` (
  `Conflict_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `User_id` bigint(20) NOT NULL,
  `Timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Conflict_id`),
  KEY `conflict_FK` (`User_id`),
  CONSTRAINT `conflict_FK` FOREIGN KEY (`User_id`) REFERENCES `user` (`User_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;