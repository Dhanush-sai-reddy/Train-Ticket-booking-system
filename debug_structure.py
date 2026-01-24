import json
import os

files = ['stations.json', 'trains.json']

for f in files:
    if os.path.exists(f):
        print(f"--- {f} ---")
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
                print(f"Type: {type(data)}")
                if isinstance(data, dict):
                    keys = list(data.keys())
                    print(f"Keys: {keys[:20]}") # First 20 keys
                    # Check if keys are data themselves or wrappers
                    if keys:
                        first_val = data[keys[0]]
                        print(f"Type of value for key '{keys[0]}': {type(first_val)}")
                        if isinstance(first_val, dict):
                             print(f"Keys of first item: {list(first_val.keys())}")
                elif isinstance(data, list):
                    print(f"Length: {len(data)}")
                    if data:
                        print(f"First item keys: {list(data[0].keys())}")
        except Exception as e:
            print(f"Error: {e}")
