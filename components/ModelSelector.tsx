import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AVAILABLE_MODELS } from '../services/geminiService';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onValueChange }) => {
  return (
    <div className="w-full">
      <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">
        Model
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-zinc-950 border-zinc-700 text-zinc-300 focus:ring-purple-600">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
          <SelectGroup>
            <SelectLabel className="text-zinc-500">Available Models</SelectLabel>
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="focus:bg-zinc-800 focus:text-white cursor-pointer"
              >
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1 bg-zinc-800 text-zinc-400 border-zinc-700"
                    >
                      {model.badge}
                    </Badge>
                  </div>
                  <span className="text-xs text-zinc-500 line-clamp-1">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
