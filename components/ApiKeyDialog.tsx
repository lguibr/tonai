import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getApiKey, setApiKey } from '../services/geminiService';
import { Key } from 'lucide-react';
import ModelSelector from './ModelSelector';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({
  open,
  onOpenChange,
  selectedModel,
  onModelChange,
}) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setKey(getApiKey() || '');
    }
  }, [open]);

  const handleSave = () => {
    setApiKey(key);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Set Gemini API Key
          </DialogTitle>
          <DialogDescription>
            To use TonAI, you need to provide your own Google Gemini API Key. The key is stored
            locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="col-span-3"
              type="password"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Model</Label>
            <div className="col-span-3">
              <ModelSelector value={selectedModel} onValueChange={onModelChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
