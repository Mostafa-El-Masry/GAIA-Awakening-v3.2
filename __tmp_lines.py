from pathlib import Path

path = Path(r'app/apollo/(tabs)/tower/components/Tower.tsx')
with path.open('r', encoding='utf-8') as fh:
    for idx, line in enumerate(fh, 1):
        if 500 <= idx <= 640:
            print(f"{idx:04d}: {line.rstrip()}" )
