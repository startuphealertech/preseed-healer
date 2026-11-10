import Image, { type ImageProps } from "next/image";

/**
 * next/image that optimises our own uploads (/api/v1/uploads/…) and passes external
 * https images through unoptimised, so the optimiser can't be used as an open proxy.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const external = /^https?:\/\//.test(src);
  return <Image {...props} unoptimized={external || props.unoptimized} alt={props.alt} />;
}
