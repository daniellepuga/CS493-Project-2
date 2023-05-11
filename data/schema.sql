CREATE TABLE `businesses` (
  `id` mediumint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(2) NOT NULL,
  `zip` char(5) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `subcategory` varchar(255) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ownerid` mediumint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ownerid` (`ownerid`)
);

CREATE TABLE `reviews` (
  `id` mediumint NOT NULL AUTO_INCREMENT,
  `userid` mediumint NOT NULL,
  `businessid` mediumint NOT NULL,
  `dollars` mediumint NOT NULL,
  `stars` mediumint NOT NULL,
  `review` text,
  PRIMARY KEY (`id`),
  KEY `businessid` (`businessid`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`businessid`) REFERENCES `businesses` (`id`)
);

CREATE TABLE `photos` (
  `id` mediumint NOT NULL AUTO_INCREMENT,
  `userid` mediumint NOT NULL,
  `businessid` mediumint NOT NULL,
  `caption` text,
  PRIMARY KEY (`id`),
  KEY `businessid` (`businessid`),
  CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`businessid`) REFERENCES `businesses` (`id`)
);