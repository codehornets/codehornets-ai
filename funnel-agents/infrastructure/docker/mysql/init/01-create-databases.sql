-- Create databases for each CRM application
CREATE DATABASE IF NOT EXISTS `handymate_developer`;
CREATE DATABASE IF NOT EXISTS `handymate_dancer`;
CREATE DATABASE IF NOT EXISTS `handymate_painter`;
CREATE DATABASE IF NOT EXISTS `handymate_driver`;
CREATE DATABASE IF NOT EXISTS `handymate_influencer`;
CREATE DATABASE IF NOT EXISTS `handymate_hunter`;
CREATE DATABASE IF NOT EXISTS `handymate_seller`;
CREATE DATABASE IF NOT EXISTS `handymate_trader`;
CREATE DATABASE IF NOT EXISTS `handymate_n8n`;

-- Grant privileges to the handymate user on all databases
GRANT ALL PRIVILEGES ON `handymate_developer`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_dancer`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_painter`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_driver`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_influencer`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_hunter`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_seller`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_trader`.* TO 'handymate'@'%';
GRANT ALL PRIVILEGES ON `handymate_n8n`.* TO 'handymate'@'%';

FLUSH PRIVILEGES;
