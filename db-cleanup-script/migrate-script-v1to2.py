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

for index, (math_id, math_dict) in enumerate(legacy_maths.items(), start=1):
    print(f"processing {math_id} ({index}/{len(legacy_maths)})")
    if 'encryptedValue' not in math_dict:
        print("  no encryptedValue (very legacy)")
        continue

    assert 'timestamp' in math_dict

    if math_id in new_maths:
        print("  already copied")
        continue

    # add 'continue' here to figure out correct value of total or to dry-run

    print("  copying")
    new_ref = firebase_admin.db.reference('/maths-v2/' + math_id)
    assert new_ref.get() is None
    new_ref.set({
        'content': math_dict['encryptedValue'],
        'owner': ''.join(random.SystemRandom().choices(string.ascii_letters, k=50)),
    })
