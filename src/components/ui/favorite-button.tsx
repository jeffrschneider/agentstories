"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/stores";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  storyId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline";
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  storyId,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const isFav = isFavorite(storyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(storyId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "transition-colors",
        isFav && "text-red-500 hover:text-red-600",
        className
      )}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isFav && "fill-current",
          showLabel && "mr-2"
        )}
      />
      {showLabel && (isFav ? "Unfavorite" : "Favorite")}
    </Button>
  );
}
