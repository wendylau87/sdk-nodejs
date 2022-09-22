CREATE TABLE `scheduler` (
  `id` varchar(64) NOT NULL,
  `task_id` varchar(200) NOT NULL,
  `task_name` varchar(200) NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `finish_time` datetime(6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `error_message` text,
  `pod_id` varchar(100) DEFAULT NULL,
  `pod_position` int(11) DEFAULT NULL,
  `partition_key` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `scheduler_start_time_IDX` (`start_time`,`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8