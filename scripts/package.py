"""Chạy tại gốc dự án sau npm run build."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys

root = Path.cwd()
out = root.parent / 'Tieng-Trung-Tu-Dau-Windows-x64.zip'
runtime = root / 'node_modules/electron/dist'
assert (runtime / 'electron.exe').exists() and (root / 'dist/index.html').exists()
with ZipFile(out, 'w', ZIP_DEFLATED, compresslevel=5) as z:
    for f in runtime.rglob('*'):
        if f.is_file() and f.name not in ('default_app.asar', 'electron.d.ts'):
            target = 'Tieng-Trung-Tu-Dau.exe' if f.name == 'electron.exe' else f.relative_to(runtime)
            z.write(f, str(target))
    for name in ['package.json', 'dist', 'electron', 'src/core', 'content/course.json', 'content/audio', 'content/README.md', 'content/course.schema.json']:
        p = root / name
        for f in p.rglob('*') if p.is_dir() else [p]:
            if f.is_file():
                z.write(f, 'resources/app/' + f.relative_to(root).as_posix())
    z.write(root/'node_modules/@fontsource/noto-sans-sc/LICENSE','resources/app/font-LICENSE.txt')
    z.writestr('HUONG-DAN.txt','Giải nén toàn bộ ZIP rồi mở Tieng-Trung-Tu-Dau.exe. Tiến độ được lưu riêng cho tài khoản Windows hiện tại.')
print(out)
if len(sys.argv)>1:
    with ZipFile(out) as z:
        z.extractall(sys.argv[1])
