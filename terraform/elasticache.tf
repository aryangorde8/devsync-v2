# ElastiCache Redis

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.project_name}-redis-subnet-group"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # Maintenance
  maintenance_window = "sun:05:00-sun:06:00"

  # Snapshots (for production)
  snapshot_retention_limit = var.environment == "prod" ? 7 : 0
  snapshot_window          = var.environment == "prod" ? "04:00-05:00" : null

  # Notifications
  notification_topic_arn = var.environment == "prod" ? aws_sns_topic.alerts[0].arn : null

  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project_name}-redis7"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name        = "${var.project_name}-redis-params"
    Environment = var.environment
  }
}

# SNS Topic for alerts (production only)
resource "aws_sns_topic" "alerts" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${var.project_name}-alerts"

  tags = {
    Environment = var.environment
  }
}
