import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, count, interactive = false, onSelect }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.round(rating);
        return (
          <Star
            key={star}
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`w-4 h-4 ${
              isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          />
        );
      })}
      {rating > 0 && <span className="text-xs font-bold text-slate-700 ml-1">{rating}</span>}
      {count !== undefined && <span className="text-xs text-slate-500">({count} reviews)</span>}
    </div>
  );
};
