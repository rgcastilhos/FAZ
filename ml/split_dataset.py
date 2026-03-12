import argparse
import os
import random
import shutil
from pathlib import Path


def copy_files(files: list[Path], dst_dir: Path) -> None:
    dst_dir.mkdir(parents=True, exist_ok=True)
    for src in files:
        shutil.copy2(src, dst_dir / src.name)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="in_dir", required=True, help="Pasta com subpastas por classe")
    p.add_argument("--out", dest="out_dir", required=True, help="Saida dataset/{train,val,test}/classe")
    p.add_argument("--val", type=float, default=0.15)
    p.add_argument("--test", type=float, default=0.0)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    in_dir = Path(args.in_dir)
    out_dir = Path(args.out_dir)
    if not in_dir.exists():
        raise SystemExit(f"Input nao existe: {in_dir}")
    if args.val < 0 or args.test < 0 or (args.val + args.test) >= 1.0:
        raise SystemExit("val/test invalidos (val+test precisa ser < 1.0)")

    random.seed(args.seed)

    # Accept common image extensions.
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    classes = [d for d in in_dir.iterdir() if d.is_dir()]
    if not classes:
        raise SystemExit("Nenhuma subpasta de classe encontrada.")

    for cls_dir in classes:
        files = [f for f in cls_dir.iterdir() if f.is_file() and f.suffix.lower() in exts]
        if not files:
            continue
        random.shuffle(files)

        n = len(files)
        n_test = int(round(n * args.test))
        n_val = int(round(n * args.val))
        n_train = max(0, n - n_val - n_test)

        train_files = files[:n_train]
        val_files = files[n_train : n_train + n_val]
        test_files = files[n_train + n_val :]

        copy_files(train_files, out_dir / "train" / cls_dir.name)
        copy_files(val_files, out_dir / "val" / cls_dir.name)
        if test_files:
            copy_files(test_files, out_dir / "test" / cls_dir.name)

        print(f"{cls_dir.name}: train={len(train_files)} val={len(val_files)} test={len(test_files)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
