"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add item...",
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()]);
      setInputValue("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md"
          >
            <span className="text-sm">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded-full"
              onClick={() => removeTag(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || disabled}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
