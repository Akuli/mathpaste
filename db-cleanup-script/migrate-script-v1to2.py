import glob
import random
import string

import firebase_admin.credentials
import firebase_admin.db


DATABASE_URL = 'https://mathpaste-8cc8e.firebaseio.com'

print("Initializing Firebase...")
[private_key_path] = glob.glob('privatekey/*.json')
cred = firebase_admin.credentials.Certificate(private_key_path)
firebase_admin.initialize_app(cred, {'databaseURL': DATABASE_URL})

print("getting all legacy maths")
legacy_maths = firebase_admin.db.reference('maths').get()

print("getting all new maths")
new_maths = firebase_admin.db.reference('maths-v2').get()

for index, (math_id, math_dict) in enumerate(sorted(legacy_maths.items()), start=1):
    print(f"processing {math_id} ({index}/{len(legacy_maths)})")
    if 'encryptedValue' not in math_dict:
        print("  no encryption used (very legacy)")
        continue

    assert math_dict.keys() == {'timestamp', 'encryptedValue'}
    assert isinstance(math_dict['timestamp'], int)
    assert isinstance(math_dict['encryptedValue'], str)

    if math_id in new_maths:
        assert new_maths[math_id]['content'] == math_dict
        print("  already copied")
        continue

    print("  copying")
    new_ref = firebase_admin.db.reference(f'/maths-v2/{math_id}')
    new_ref.set({
        'content': math_dict,
        'owner': ''.join(random.SystemRandom().choices(string.ascii_letters, k=50)),
    })
