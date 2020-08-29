from datetime import datetime, timedelta
import glob
import json
import os
import sys

import firebase_admin.credentials
import firebase_admin.db


# change this if you fork mathpaste and make it use your own database
DATABASE_URL = 'https://mathpaste-8cc8e.firebaseio.com'

# maths expire after 30 days
# this is much longer in case something very important expires too soon
DELETION_AGE = timedelta(days=365)

MATHS_TABLE = 'maths-v2'


def abort_if_user_says_no(message):
    if input(message + " (y/n) ").lower() != 'y':
        print("Aborted.")
        sys.exit(0)


def init_firebase():
    print("Initializing Firebase...")
    [private_key_path] = glob.glob('privatekey/*.json')
    cred = firebase_admin.credentials.Certificate(private_key_path)
    firebase_admin.initialize_app(cred, {'databaseURL': DATABASE_URL})


def download_everything_from_db():
    print("Downloading everything from DB...")
    return firebase_admin.db.reference('/').get()


def create_backup(db_contents):
    directory_path = os.path.expanduser('~/mathpaste-backups')
    try:
        os.mkdir(directory_path)
    except FileExistsError:
        pass

    file_path = os.path.join(directory_path, datetime.now().strftime('%Y-%m-%dT%H-%M-%S.json'))
    print("Saving DB contents to", file_path, "...")

    # 'x' gives error if backup_path exists
    with open(file_path, 'x') as file:
        # there is an "Export JSON" button in firebase console
        # this dumps using the same format
        json.dump(db_contents, file)


def which_maths_to_delete(db_contents):
    print("Figuring out which maths to delete...")

    now = datetime.now()
    ids_to_delete = []

    for math_id, value_dict in db_contents[MATHS_TABLE].items():
        # the timestamp is in milliseconds since epoch
        # datetime module wants seconds since epoch so we /1000
        math_time = datetime.fromtimestamp(value_dict['content']['timestamp'] / 1000)
        if math_time > now:
            print("WARNING: timestamp of math %s is in the future" % math_id)
        if math_time < now - DELETION_AGE:
            ids_to_delete.append(math_id)

    return ids_to_delete


def confirm_deletion(db_contents, ids_to_delete):
    print(f"{len(ids_to_delete)} maths out of {len(db_contents[MATHS_TABLE])} total would get deleted.")
    abort_if_user_says_no("Do you want to delete the old maths?")


def delete_maths(ids_to_delete):
    for count, math_id in enumerate(ids_to_delete, start=1):
        path = f'/{MATHS_TABLE}/{math_id}'
        print(f"Deleting {path} ({count}/{len(ids_to_delete)})...")
        firebase_admin.db.reference(path).delete()


def main():
    init_firebase()

    db_contents = download_everything_from_db()
    create_backup(db_contents)
    ids_to_delete = which_maths_to_delete(db_contents)
    print()
    if ids_to_delete:
        confirm_deletion(db_contents, ids_to_delete)
        delete_maths(ids_to_delete)
        print("Done.")
    else:
        print("No maths to delete.")


if __name__ == '__main__':
    main()
