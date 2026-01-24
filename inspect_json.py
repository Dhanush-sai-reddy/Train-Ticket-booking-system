import json
import os

files = ['stations.json', 'trains.json', 'schedules.json']
base_path = r'c:\Users\dhanu\Downloads\railig'

results = {}

for f in files:
    path = os.path.join(base_path, f)
    try:
        with open(path, 'r', encoding='utf-8') as file:
            # Read first 5000 chars to likely get a full first object
            content = file.read(5000)
            if content.strip().startswith('['):
                # Array found
                start = content.find('{')
                end = content.find('}', start) + 1
                if start != -1 and end != 0:
                    obj_str = content[start:end]
                    obj = json.loads(obj_str)
                    results[f] = list(obj.keys())
                else:
                    results[f] = "Could not isolate object"
            else:
                results[f] = "Not an array"
    except Exception as e:
        results[f] = str(e)

print("SCHEMA_START")
print(json.dumps(results, indent=2))
print("SCHEMA_END")
