"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

export default function ProductImage({
  src,
  alt,
  onError,
  unoptimized = true,
  ...props
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={
          props.fill
            ? "absolute inset-0 flex items-center justify-center bg-surface text-muted/30 font-display text-2xl"
            : "flex h-full w-full items-center justify-center bg-surface text-muted/30 font-display text-2xl"
        }
      >
        V
      </span>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
