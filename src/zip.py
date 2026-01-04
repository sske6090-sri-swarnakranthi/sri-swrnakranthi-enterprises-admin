import os
import zipfile

source_folder = r"D:\shopping-admin\public\new-images"
output_folder = r"D:\shopping-admin\public"
files = [f for f in os.listdir(source_folder) if os.path.isfile(os.path.join(source_folder, f))]
batch_size = 400
total = len(files)
zip_index = 1

for i in range(0, total, batch_size):
    batch = files[i:i + batch_size]
    zip_path = os.path.join(output_folder, f"small{zip_index}.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_name in batch:
            full_path = os.path.join(source_folder, file_name)
            zipf.write(full_path, arcname=file_name)
    zip_index += 1
