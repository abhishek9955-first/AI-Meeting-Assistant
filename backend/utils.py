import os
import uuid


def save_uploaded_file(file, upload_dir="uploads"):
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"

    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return file_path