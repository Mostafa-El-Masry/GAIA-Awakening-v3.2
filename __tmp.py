from pathlib import Path
path = Path(r'app/wealth/components/PlansCombined.tsx')
with path.open('r', encoding='utf-8') as fh:
    for idx, line in enumerate(fh, 1):
        if 808 <= idx <= 900:
            print(f"{idx:04d}: {line.rstrip()}" )
