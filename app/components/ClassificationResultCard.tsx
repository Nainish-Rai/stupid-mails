"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassificationResultProps {
  result: {
    input: {
      sender: string;
      subject: string;
      date: string;
    };
    classification: string;
    reason: string;
    confidence?: number;
    success: boolean;
  };
}

// Classification category styles
const CATEGORY_STYLES = {
  ATTN: "bg-red-50 border-red-200 text-red-800",
  "FK-U": "bg-orange-50 border-orange-200 text-orange-800",
  MARKETING: "bg-blue-50 border-blue-200 text-blue-800",
  "TAKE-A-LOOK": "bg-emerald-50 border-emerald-200 text-emerald-800",
  HMMMM: "bg-purple-50 border-purple-200 text-purple-800",
} as const;

export function ClassificationResultCard({
  result,
}: ClassificationResultProps) {
  const categoryStyle =
    CATEGORY_STYLES[result.classification as keyof typeof CATEGORY_STYLES] ||
    "bg-gray-50 border-gray-200 text-gray-800";

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
            {result.input.subject}
          </h3>
          <span className="text-xs text-gray-500">{result.input.date}</span>
        </div>

        <div className="text-xs text-gray-700 mb-3">
          From: {result.input.sender}
        </div>

        <Badge
          variant="outline"
          className={cn("text-xs font-medium px-2 py-1 mb-3", categoryStyle)}
        >
          {result.classification}
          {result.confidence && result.confidence > 0.8 && (
            <span className="ml-1 opacity-60">★</span>
          )}
        </Badge>

        <p className="text-xs text-gray-600 mt-2 line-clamp-3">
          {result.reason}
        </p>
      </CardContent>
    </Card>
  );
}
