from sqlalchemy import text
from app.database.connection import get_engine

def setup_db():
    engine = get_engine()
    print(f"Connecting to database with dialect: {engine.name}")
    
    with engine.begin() as conn:
        # Drop tables in correct order due to foreign keys (Orders references Customers)
        conn.execute(text("DROP TABLE IF EXISTS Orders"))
        conn.execute(text("DROP TABLE IF EXISTS Customers"))

        # Create Customers table
        conn.execute(text("""
        CREATE TABLE Customers (
            customer_id INT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            city VARCHAR(255) NOT NULL
        )
        """))

        # Create Orders table
        conn.execute(text("""
        CREATE TABLE Orders (
            order_id INT PRIMARY KEY,
            customer_id INT,
            price DECIMAL(10, 2),
            FOREIGN KEY (customer_id) REFERENCES Customers (customer_id)
        )
        """))

        # Insert mock customers
        customers = [
            {"customer_id": 1, "customer_name": "Alice", "city": "Chennai"},
            {"customer_id": 2, "customer_name": "Bob", "city": "Bangalore"},
            {"customer_id": 3, "customer_name": "Charlie", "city": "Chennai"},
            {"customer_id": 4, "customer_name": "David", "city": "Mumbai"},
            {"customer_id": 5, "customer_name": "Eva", "city": "Chennai"}
        ]
        conn.execute(
            text("INSERT INTO Customers (customer_id, customer_name, city) VALUES (:customer_id, :customer_name, :city)"),
            customers
        )

        # Insert mock orders
        orders = [
            {"order_id": 101, "customer_id": 1, "price": 250.50},
            {"order_id": 102, "customer_id": 2, "price": 99.90},
            {"order_id": 103, "customer_id": 1, "price": 120.00},
            {"order_id": 104, "customer_id": 3, "price": 450.00},
            {"order_id": 105, "customer_id": 4, "price": 1500.00},
            {"order_id": 106, "customer_id": 5, "price": 300.00}
        ]
        conn.execute(
            text("INSERT INTO Orders (order_id, customer_id, price) VALUES (:order_id, :customer_id, :price)"),
            orders
        )

    print("Mock database created and populated successfully!")

if __name__ == "__main__":
    setup_db()
