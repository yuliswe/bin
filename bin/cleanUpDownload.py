#!python3
import os
import hashlib
from collections import defaultdict
from pathlib import Path
import send2trash


def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def find_duplicates(directory):
    hashes = defaultdict(list)
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            full_path = os.path.join(dirpath, filename)
            file_hash = calculate_md5(full_path)
            hashes[file_hash].append(full_path)

    for key, values in hashes.items():
        if len(values) > 1:
            # Sort files by creation time (keep the oldest, trash the rest)
            values.sort(key=os.path.getctime)
            print(f"Duplicate files for hash {key}:")
            for value in values[1:]:  # Keep the first file, trash the rest
                print(f"Trashing file: {value}")
                send2trash.send2trash(value)


if __name__ == "__main__":
    find_duplicates(Path.home() / "Downloads")
