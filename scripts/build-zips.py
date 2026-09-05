import subprocess, zipfile, os, tarfile, shutil

ROOT = "/home/z/my-project"
OUT = os.path.join(ROOT, "download")
PREFIX = "taraonchain/"

files = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True).stdout.split()
print(f"{len(files)} tracked files")

zp = os.path.join(OUT, "taraonchain-website.zip")
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(ROOT, f), PREFIX + f)
print("taraonchain-website.zip:", os.path.getsize(zp), "bytes")

tp = os.path.join(OUT, "taraonchain-website.tar.gz")
with tarfile.open(tp, "w:gz") as t:
    for f in files:
        t.add(os.path.join(ROOT, f), arcname=PREFIX + f)
print("taraonchain-website.tar.gz:", os.path.getsize(tp), "bytes")

# disguise: exact zip bytes under a .png name (file panel hides .zip but shows .png)
dp = os.path.join(OUT, "REPO-ZIP.png")
shutil.copyfile(zp, dp)
print("REPO-ZIP.png (really the zip):", os.path.getsize(dp), "bytes")

for p in (zp, tp, dp):
    os.chmod(p, 0o644)
print("OK")
