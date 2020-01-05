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


def abort_if_user_says_no(message):
    if input(message + " (y/n) ").lower() != 'y':
        print("Aborted.")
        sys.exit(0)


def init_firebase():
    print("Initializing Firebase...")
    [private_key_path] = glob.glob('privatekey/*.json')
    cred = firebase_admin.credentials.Certificate(private_key_path)
    firebase_admin.initialize_app(cred, {'databaseURL': DATABASE_URL})


def get_big_maths_dict():
    print("Getting all maths from DB...")
    result = firebase_admin.db.reference('maths').get()
    print("  found %d maths" % len(result))
    return result


def create_backup(big_maths_dict):
    try:
        os.mkdir('backups')
    except FileExistsError:
        pass

    backup_path = datetime.now().strftime('backups/%Y-%m-%dT%H-%M-%S.json')
    print("Saving all maths to", backup_path, "...")

    # 'x' gives error if backup_path exists
    with open(backup_path, 'x') as file:
        # there is an "Export JSON" button in firebase console
        # this dumps using the same format
        json.dump({'maths': big_maths_dict}, file)


def which_maths_to_delete(big_maths_dict):
    print("Figuring out which maths to delete...")

    now = datetime.now()
    ids_to_delete = []

    for math_id, value_dict in big_maths_dict.items():
        # the timestamp is in milliseconds since epoch
        # datetime module wants seconds since epoch so we /1000
        math_time = datetime.fromtimestamp(value_dict['timestamp'] / 1000)
        if math_time > now:
            print("WARNING: timestamp of math %s is in the future" % math_id)
        if math_time < now - DELETION_AGE:
            ids_to_delete.append(math_id)

    return ids_to_delete


def confirm_deletion(big_maths_dict, ids_to_delete):
    print("{} maths ({:.1f}% of all maths) would get deleted.".format(
        len(ids_to_delete),
        len(ids_to_delete) / len(big_maths_dict) * 100,
    ))
    abort_if_user_says_no("Do you want to delete the old maths?")


def delete_maths(ids_to_delete):
    for count, math_id in enumerate(ids_to_delete, start=1):
        print("Deleting math {} ({}/{})...".format(
            math_id, count, len(ids_to_delete)))
        firebase_admin.db.reference('/maths/' + math_id).delete()


def main():
    init_firebase()

    big_maths_dict = get_big_maths_dict()
    create_backup(big_maths_dict)
    ids_to_delete = which_maths_to_delete(big_maths_dict)

    print()

    if ids_to_delete:
        confirm_deletion(big_maths_dict, ids_to_delete)
        delete_maths(ids_to_delete)
        print("Done.")
    else:
        print("No maths to delete.")


if __name__ == '__main__':
    main()
