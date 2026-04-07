import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getImageAspectRatio(imageUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width / img.height);
    };
    img.onerror = () => {
      resolve(1); // Default to square if image fails to load
    };
    img.src = imageUrl;
  });
}

export function getAspectRatioClass(aspectRatio: number): string {
  if (aspectRatio > 1.2) {
    return "aspect-[4/3]"; // Horizontal (landscape)
  } else if (aspectRatio < 0.8) {
    return "aspect-[3/4]"; // Vertical (portrait)
  } else {
    return "aspect-square"; // Square
  }
}

export function getGridClassForHomepage(aspectRatio: number, index: number): string {
  const patterns = [
    "col-span-2 row-span-2", // Large
    "col-span-1 row-span-1", // Small
    "col-span-1 row-span-1", // Small
    "col-span-1 row-span-2", // Tall
    "col-span-1 row-span-1", // Small
    "col-span-1 row-span-1", // Small
  ];
  
  if (aspectRatio > 1.2) {
    // Horizontal image - give it more columns
    return index % 3 === 0 ? "col-span-2 row-span-1" : patterns[index % patterns.length];
  } else if (aspectRatio < 0.8) {
    // Vertical image - give it more rows
    return index % 2 === 0 ? "col-span-1 row-span-2" : patterns[index % patterns.length];
  } else {
    // Square
    return patterns[index % patterns.length];
  }
}

export function getMasonryHeightClass(aspectRatio: number): string {
  if (aspectRatio > 1.2) {
    return "aspect-[4/3]"; // Horizontal
  } else if (aspectRatio < 0.7) {
    return "aspect-[3/5]"; // Very vertical
  } else if (aspectRatio < 0.9) {
    return "aspect-[3/4]"; // Vertical
  } else {
    return "aspect-square"; // Square
  }
}
