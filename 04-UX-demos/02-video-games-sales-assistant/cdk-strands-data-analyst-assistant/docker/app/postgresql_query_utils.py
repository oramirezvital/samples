from datetime import datetime, date
import boto3
import json
import psycopg2
import os
from botocore.exceptions import ClientError
from decimal import Decimal

# Environment variables
ENV = {
    "POSTGRESQL_HOST": os.environ.get("POSTGRESQL_HOST"),
    "POSTGRESQL_PORT": os.environ.get("POSTGRESQL_PORT", "5432"),
    "POSTGRESQL_USER": os.environ.get("POSTGRESQL_USER"),
    "POSTGRESQL_PASSWORD": os.environ.get("POSTGRESQL_PASSWORD"),
    "DATABASE_NAME": os.environ.get("DATABASE_NAME"),
    "QUESTION_ANSWERS_TABLE": os.environ.get("QUESTION_ANSWERS_TABLE"),
    "MAX_RESPONSE_SIZE_BYTES": int(os.environ.get("MAX_RESPONSE_SIZE_BYTES", 25600)),
    "AWS_REGION": os.environ.get("AWS_REGION", "us-east-1")
}


def validate_environment():
    """
    Validates that all required environment variables are present.
    
    Raises:
        EnvironmentError: If any required environment variables are missing
    """
    required_vars = ["POSTGRESQL_HOST", "POSTGRESQL_USER", "POSTGRESQL_PASSWORD", "DATABASE_NAME"]
    missing_vars = [var for var in required_vars if not ENV[var]]
    
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")


def get_database_credentials() -> dict:
    """
    Returns database credentials from environment variables.
    
    Returns:
        dict: Database connection parameters
    """
    return {
        "host": ENV["POSTGRESQL_HOST"],
        "port": int(ENV["POSTGRESQL_PORT"]),
        "username": ENV["POSTGRESQL_USER"],
        "password": ENV["POSTGRESQL_PASSWORD"],
        "dbname": ENV["DATABASE_NAME"]
    }
    print("get secret")
def get_postgresql_connection():
    """
    Establishes a connection to PostgreSQL using credentials from environment variables.
    
    Returns:
        Connection object if successful, False otherwise
    """
    validate_environment()
    credentials = get_database_credentials()
    
    try:
        conn = psycopg2.connect(
            host=credentials["host"],
            port=credentials["port"],
            database=credentials["dbname"],
            user=credentials["username"],
            password=credentials["password"],
        )
        print("Connected to the fleet management PostgreSQL database!")
    except (Exception, psycopg2.Error) as error:
        print("Error connecting to the PostgreSQL database:", error)
        return False
    return conn


def get_size(string: str) -> int:
    """
    Calculates the size of a string in bytes when encoded as UTF-8.
    
    Args:
        string: The string to measure
        
    Returns:
        int: Size of the string in bytes
    """
    return len(string.encode("utf-8"))


def run_sql_query_on_postgresql(sql_query: str) -> str:
    """
    Executes a SQL query on the PostgreSQL database and returns the results as JSON.
    
    The function handles connection to the database, query execution, and formatting
    of results. Special data types (Decimal, date) are properly converted for JSON.
    If the result size exceeds MAX_RESPONSE_SIZE_BYTES, it's truncated.
    
    Args:
        sql_query: SQL query string to execute
        
    Returns:
        str: JSON string containing query results or error information
    """
    print(sql_query)
    try:
        # Validate environment variables before proceeding
        validate_environment()
        
        connection = get_postgresql_connection()

        if connection == False:
            return json.dumps({
                "error": "Something went wrong connecting to the fleet management database, ask the user to try again later."
            })

        print("connected to fleet management database")

        message = ""
        cur = connection.cursor()
        records = []
        records_to_return = []

        print(sql_query)

        # Execute a SQL query
        try:
            cur.execute(sql_query)
            rows = cur.fetchall()
            column_names = [desc[0] for desc in cur.description]
            for item in rows:
                record = {}
                for x, value in enumerate(item):
                    if type(value) is Decimal:
                        record[column_names[x]] = float(value)
                    elif isinstance(value, date):
                        record[column_names[x]] = str(value)
                    else:
                        record[column_names[x]] = value
                records.append(record)
            if get_size(json.dumps(records)) > ENV["MAX_RESPONSE_SIZE_BYTES"]:
                for item in records:
                    if get_size(json.dumps(records_to_return)) <= ENV["MAX_RESPONSE_SIZE_BYTES"]:
                        records_to_return.append(item)
                message = (
                    "The data is too large, it has been truncated from "
                    + str(len(records))
                    + " to "
                    + str(len(records_to_return))
                    + " rows."
                )
            else:
                records_to_return = records

        except (Exception, psycopg2.Error) as error:
            print("Error executing SQL query:", error)
            connection.rollback()  # Rollback the transaction if there's an error
            return json.dumps({"error": str(error.pgerror) if hasattr(error, 'pgerror') else str(error)})
        finally:
            # Close the cursor and the connection
            cur.close()
            connection.close()
            
        if message != "":
            return json.dumps({"result": records_to_return, "message": message})
        else:
            return json.dumps({"result": records_to_return})
            
    except EnvironmentError as e:
        return json.dumps({"error": str(e)})
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"})