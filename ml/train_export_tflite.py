import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix


def build_datasets(data_dir: Path, img_size: int, batch_size: int):
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"
    if not train_dir.exists() or not val_dir.exists():
        raise ValueError("Dataset precisa ter pastas train/ e val/.")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        label_mode="int",
        image_size=(img_size, img_size),
        batch_size=batch_size,
        shuffle=True,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        label_mode="int",
        image_size=(img_size, img_size),
        batch_size=batch_size,
        shuffle=False,
    )

    class_names = list(train_ds.class_names)
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(autotune)
    val_ds = val_ds.cache().prefetch(autotune)
    return train_ds, val_ds, class_names


def build_model(num_classes: int, img_size: int):
    inputs = tf.keras.Input(shape=(img_size, img_size, 3), name="image")
    x = tf.keras.layers.Rescaling(1.0 / 255.0)(inputs)
    x = tf.keras.layers.RandomFlip("horizontal")(x)
    x = tf.keras.layers.RandomRotation(0.05)(x)
    x = tf.keras.layers.RandomZoom(0.1)(x)

    base = tf.keras.applications.MobileNetV3Small(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="probs")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    return model, base


def evaluate(model: tf.keras.Model, val_ds):
    y_true = []
    y_pred = []
    for batch_images, batch_labels in val_ds:
        probs = model.predict(batch_images, verbose=0)
        y_true.extend(batch_labels.numpy().tolist())
        y_pred.extend(np.argmax(probs, axis=1).tolist())
    return np.array(y_true), np.array(y_pred)


def convert_to_tflite(model: tf.keras.Model, out_path: Path, img_size: int, train_ds):
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    # Representative dataset for better quantization (still works if converter decides not to use int8).
    def rep_ds():
        # Take a small sample. Keep it light to avoid long conversion time.
        for images, _ in train_ds.take(50):
            # float32 input, already in [0,255] here; converter expects float32.
            yield [tf.cast(images, tf.float32)]

    converter.representative_dataset = rep_ds

    # Keep float32 input/output to simplify Android integration (fast enough on most devices).
    # If you want full int8, we can enable it later with proper calibration and IO types.
    tflite_model = converter.convert()
    out_path.write_bytes(tflite_model)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True, help="Pasta com train/ e val/")
    p.add_argument("--out", required=True, help="Pasta de saida")
    p.add_argument("--img", type=int, default=224, help="Tamanho da imagem (ex: 224)")
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--fine_tune_epochs", type=int, default=5)
    args = p.parse_args()

    data_dir = Path(args.data)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    train_ds, val_ds, class_names = build_datasets(data_dir, args.img, args.batch)
    num_classes = len(class_names)

    model, base = build_model(num_classes, args.img)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
    ]

    model.fit(val_ds, validation_data=val_ds, epochs=1, verbose=0)  # warmup graph
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    # Fine-tune last part of backbone
    base.trainable = True
    for layer in base.layers[:-40]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=args.fine_tune_epochs, callbacks=callbacks)

    # Evaluate
    y_true, y_pred = evaluate(model, val_ds)
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()

    (out_dir / "labels.txt").write_text("\n".join(class_names) + "\n", encoding="utf-8")
    (out_dir / "metrics.json").write_text(
        json.dumps({"report": report, "confusion_matrix": cm}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    tflite_path = out_dir / "model.tflite"
    convert_to_tflite(model, tflite_path, args.img, train_ds)
    print(f"OK: {tflite_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
