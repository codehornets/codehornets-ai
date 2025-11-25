"""
Database connection management.

Provides database connection pooling, session management,
and initialization utilities.
"""

from typing import Optional, Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import Pool

from config.settings import get_settings
from core.logger import get_logger
from .models import Base


class Database:
    """
    Database connection manager.

    Manages SQLAlchemy engine, session factory, and provides
    utilities for database operations.
    """

    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database manager.

        Args:
            database_url: Database connection URL
        """
        self.settings = get_settings()
        self.logger = get_logger("database")

        # Database URL
        self.database_url = database_url or self.settings.database_url

        # Create engine
        self.engine = create_engine(
            self.database_url,
            pool_size=self.settings.database_pool_size,
            max_overflow=self.settings.database_max_overflow,
            pool_pre_ping=True,  # Enable connection health checks
            echo=self.settings.debug,  # SQL logging in debug mode
        )

        # Setup connection event listeners
        self._setup_event_listeners()

        # Session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
        )

    def _setup_event_listeners(self):
        """Setup SQLAlchemy event listeners."""

        @event.listens_for(Pool, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Handle new database connections."""
            self.logger.debug("Database connection established")

        @event.listens_for(Pool, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Handle connection checkout from pool."""
            self.logger.debug("Database connection checked out from pool")

    def create_tables(self):
        """Create all database tables."""
        try:
            Base.metadata.create_all(bind=self.engine)
            self.logger.info("Database tables created successfully")
        except Exception as e:
            self.logger.error(f"Failed to create database tables: {e}")
            raise

    def drop_tables(self):
        """Drop all database tables (use with caution!)."""
        try:
            Base.metadata.drop_all(bind=self.engine)
            self.logger.warning("All database tables dropped")
        except Exception as e:
            self.logger.error(f"Failed to drop database tables: {e}")
            raise

    def get_session(self) -> Session:
        """
        Get a new database session.

        Returns:
            Session: SQLAlchemy session
        """
        return self.SessionLocal()

    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """
        Provide a transactional scope for database operations.

        Yields:
            Session: SQLAlchemy session

        Example:
            with db.session_scope() as session:
                session.add(obj)
                session.commit()
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def health_check(self) -> bool:
        """
        Check database connection health.

        Returns:
            bool: True if database is accessible
        """
        try:
            with self.session_scope() as session:
                session.execute("SELECT 1")
            return True
        except Exception as e:
            self.logger.error(f"Database health check failed: {e}")
            return False

    def close(self):
        """Close database connections and dispose of engine."""
        try:
            self.engine.dispose()
            self.logger.info("Database connections closed")
        except Exception as e:
            self.logger.error(f"Error closing database: {e}")


# Global database instance
_database: Optional[Database] = None


def get_database() -> Database:
    """
    Get global database instance.

    Returns:
        Database: Database manager instance
    """
    global _database
    if _database is None:
        _database = Database()
    return _database


def init_database(create_tables: bool = True) -> Database:
    """
    Initialize database.

    Args:
        create_tables: Whether to create tables

    Returns:
        Database: Initialized database manager
    """
    logger = get_logger("database")
    logger.info("Initializing database")

    db = get_database()

    if create_tables:
        db.create_tables()

    # Health check
    if db.health_check():
        logger.info("Database initialized successfully")
    else:
        logger.error("Database initialization failed health check")

    return db


# Dependency for FastAPI
def get_db_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.

    Yields:
        Session: Database session
    """
    db = get_database()
    session = db.get_session()
    try:
        yield session
    finally:
        session.close()
