# SDK NodeJS
#### _SDK build from NodeJS for Microservices Development_

## Main Features
- Logging with or without context using pino logger.
- Built-in scheduler support multi pod in kubernetes and multi partition.
- MySQL Client using Sequelize
- Redis Client
- Kafka Client
- UUID Generator
- Database Migration tool

## DB Migration

SDK-Node using [db-migrate](https://db-migrate.readthedocs.io/en/latest/) for database migration.

#### How to create new table.
```sh
$ node node_modules/db-migrate/bin/db-migrate create scheduler --sql-file
```
this will create 3 files
```sh
./migrations/20111219120000-scheduler.js
./migrations/sqls/20111219120000-scheduler-up.sql
./migrations/sqls/20111219120000-scheduler-down.sql
```
The sql files will have the following content:
```sh
/* replace with your sql */
```

#### how to run migration.
```sh
$ node node_modules/db-migrate/bin/db-migrate up
received data: CREATE TABLE `scheduler` (
  `id` varchar(64) NOT NULL,
  `scheduler_name` varchar(200) NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `finish_time` datetime(6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `error_message` text,
  `pod_id` varchar(100) DEFAULT NULL,
  `pod_position` int(11) DEFAULT NULL,
  `partition_key` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
[INFO] Processed migration 20220512094814-scheduler
[INFO] Done
```
#### how to revert migration
```sh
$ node node_modules/db-migrate/bin/db-migrate down
[INFO] Defaulting to running 1 down migration.
received data: DROP TABLE IF EXISTS `scheduler`;
[INFO] Processed migration 20220512094814-scheduler
[INFO] Done
```





  
