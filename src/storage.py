import os
import json
import logging
from typing import Dict, List, Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Configuration
USE_S3 = os.getenv('USE_S3', 'false').lower() == 'true'
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'clinical-trial-matcher-data')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

# In-memory storage for local development
_memory_storage: Dict[str, dict] = {}

# S3 client (initialized only if USE_S3 is true)
s3_client = None
if USE_S3:
    try:
        s3_client = boto3.client('s3', region_name=AWS_REGION)
        # Test credentials by attempting to list buckets
        s3_client.list_buckets()
        logger.info(f"S3 client initialized for bucket: {S3_BUCKET_NAME}")
    except Exception as e:
        logger.error(f"Failed to initialize S3 client: {e}")
        s3_client = None
        USE_S3 = False
        logger.warning("Falling back to in-memory storage")

def save_data(key: str, data: dict) -> bool:
    try:
        if USE_S3 and s3_client:
            try:
                s3_client.put_object(
                    Bucket=S3_BUCKET_NAME,
                    Key=key,
                    Body=json.dumps(data),
                    ContentType='application/json'
                )
                logger.info(f"Saved to S3: {key}")
                return True
            except Exception as s3_error:
                logger.error(f"S3 error saving {key}: {s3_error}")
                _memory_storage[key] = data
                return True
        else:
            _memory_storage[key] = data
            logger.debug(f"Saved to memory: {key}")
        return True
    except Exception as e:
        logger.error(f"Error saving data to {key}: {e}")
        return False

def load_data(key: str) -> Optional[dict]:
    try:
        if USE_S3 and s3_client:
            try:
                response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=key)
                data = json.loads(response['Body'].read())
                logger.debug(f"Loaded from S3: {key}")
                return data
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    logger.debug(f"Key not found: {key}")
                    # Try memory storage as fallback
                    data = _memory_storage.get(key)
                    return data
                else:
                    logger.error(f"Error loading data from {key}: {e}")
                    data = _memory_storage.get(key)
                    return data
            except Exception as s3_error:
                logger.error(f"Error loading data from {key}: {s3_error}")
                data = _memory_storage.get(key)
                return data
        else:
            data = _memory_storage.get(key)
            logger.debug(f"Loaded from memory: {key}")
            return data
    except Exception as e:
        logger.error(f"Error loading data from {key}: {e}")
        return None

def delete_data(key: str) -> bool:
    try:
        if USE_S3 and s3_client:
            try:
                s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
                logger.info(f"Deleted from S3: {key}")
                return True
            except Exception as s3_error:
                logger.error(f"Error deleting data from {key}: {s3_error}")
                if key in _memory_storage:
                    del _memory_storage[key]
                return True
        else:
            if key in _memory_storage:
                del _memory_storage[key]
                logger.debug(f"Deleted from memory: {key}")
        return True
    except Exception as e:
        logger.error(f"Error deleting data from {key}: {e}")
        return False

def list_keys(prefix: str) -> List[str]:
    try:
        if USE_S3 and s3_client:
            try:
                response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=prefix)
                keys = [obj['Key'] for obj in response.get('Contents', [])]
                logger.debug(f"Listed {len(keys)} keys from S3 with prefix: {prefix}")
                return keys
            except Exception as s3_error:
                logger.error(f"Error listing keys with prefix {prefix}: {s3_error}")
                keys = [k for k in _memory_storage.keys() if k.startswith(prefix)]
                return keys
        else:
            keys = [k for k in _memory_storage.keys() if k.startswith(prefix)]
            logger.debug(f"Listed {len(keys)} keys from memory with prefix: {prefix}")
            return keys
    except Exception as e:
        logger.error(f"Error listing keys with prefix {prefix}: {e}")
        return []


def get_storage_info() -> dict:
    return {
        "storage_type": "s3" if USE_S3 else "memory",
        "bucket_name": S3_BUCKET_NAME if USE_S3 else None,
        "region": AWS_REGION if USE_S3 else None,
    }
