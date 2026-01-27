import base64
import re
import tempfile
import os

def is_data_uri(s: str) -> bool:
    return isinstance(s, str) and s.startswith("data:")

def process_data_uri(data_uri: str):
    # Parse data URI
    # format: data:[<mime type>][;charset=<charset>][;base64],<encoded data>
    match = re.match(r'data:([^;]+);base64,(.*)', data_uri)
    if not match:
        return data_uri
    
    mime_type = match.group(1)
    b64_data = match.group(2)
    
    # Decode
    data = base64.b64decode(b64_data)
    
    # Create temp file
    suffix = '.' + mime_type.split('/')[-1] if '/' in mime_type else ''
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tfile.write(data)
    tfile.close()
    
    return open(tfile.name, 'rb')

# This logic will be added to ReplicateService
