# DB Cleanup Script

This directory contains a Python script that deletes old MathPastes.
It can be ran only by the person whose Google account is being used for the Firebase stuff
(that is, Akuli or someone who forks MathPaste),
and rest of this README is for that person.

If you forked MathPaste and you don't want to use my Firebase DB,
you need to change the URL of the DB in `script.py`.
You also need to change MathPaste itself.
At the time of writing this README, the file that you should change is `js/pasteManager.ts`.


## Running the script

Make sure that you have Python 3.5 or newer. Clone the repo and `cd` to the correct directory:

```
$ git clone https://github.com/Akuli/mathpaste
$ cd mathpaste/db-cleanup-script
```

Create a virtual environment:

```
$ python3 -m venv env
$ source env/bin/activate
(env) $ pip install firebase-admin
```

Next you need to download the credentials for accessing Firebase. Do it like this:

1. Go to [Firebase console](https://console.firebase.google.com).
2. Click MathPaste.
3. Click the setting icon next to "Project overview".
4. Click "Project settings" in the menu that appears.
5. Click "Service accounts".
6. Click "Firebase Admin SDK".
7. Click "Generate new private key".

This will give you a very secret JSON file.
Don't commit it to git!
Instead, create a `privatekey` folder in the directory that contains this README and `script.py`,
and move the JSON file there:

```
(env) $ mkdir privatekey
(env) $ mv ~/Downloads/mathpaste-something-firebase-adminsdk-something-something.json privatekey/
```

The `privatekey` directory is in the `.gitignore`,
and that should prevent you from accidentally committing the JSON file.

Run the script:

```
(env) $ python3 script.py
```

The script makes a backup of the database and asks you to confirm before it deletes anything.
