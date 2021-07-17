CREATE DATABASE logger;
CREATE USER  'dev'@'localhost' IDENTIFIED BY 'dev';
FLUSH PRIVILEGES;
GRANT ALL PRIVILEGES ON *.* TO 'dev'@'%' IDENTIFIED BY 'dev' WITH GRANT OPTION;


CREATE TABLE logger.`user` (
	Name varchar(100) NOT NULL,
	User_id BIGINT auto_increment NOT NULL,
	Password varchar(100) NOT NULL,
	Email varchar(100) NOT NULL,
	`Role` varchar(100) NOT NULL,
	Key_id varchar(100) NULL,
	CONSTRAINT user_PK PRIMARY KEY (User_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


CREATE TABLE logger.unknown_transcation (
	Key_id varchar(100) NOT NULL,
	`Timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	Transaction_id BIGINT auto_increment NOT NULL,
	CONSTRAINT unknown_transcation_PK PRIMARY KEY (Transaction_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


CREATE TABLE logger.`transaction` (
	Transaction_id BIGINT auto_increment NOT NULL,
	Key_id varchar(100) NOT NULL,
	User_id BIGINT NOT NULL,
	`Timestamp` DATE DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT transaction_PK PRIMARY KEY (Transaction_id),
	CONSTRAINT transaction_FK FOREIGN KEY (User_id) REFERENCES logger.`user`(User_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;
