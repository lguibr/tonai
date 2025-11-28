import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, FolderOpen, Save } from 'lucide-react';
import { saveTrack, getTracks, deleteTrack } from '../services/storageService';

interface Track {
  id: string;
  name: string;
  code: string;
  collection: string;
  createdAt: number;
}

interface LibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCode: string;
  onLoadCode: (code: string) => void;
  mode: 'save' | 'load'; // 'save' opens directly to save form, 'load' shows list
}

const LibraryDialog: React.FC<LibraryDialogProps> = ({
  open,
  onOpenChange,
  currentCode,
  onLoadCode,
  mode,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [collection, setCollection] = useState('');
  const [view, setView] = useState<'list' | 'save'>('list');

  const loadTracks = async () => {
    const loaded = await getTracks();
    // Sort by newest first
    setTracks(loaded.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadTracks();
      setView(mode === 'save' ? 'save' : 'list');
      if (mode === 'save') {
        setName(''); // Reset name on new save
      }
    }
  }, [open, mode]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveTrack({
      name,
      code: currentCode,
      collection: collection || 'Unsorted',
    });
    await loadTracks();
    setView('list');
    if (mode === 'save') {
      onOpenChange(false); // Close if we just wanted to save
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTrack(id);
    await loadTracks();
  };

  const handleLoad = (code: string) => {
    onLoadCode(code);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'save' ? <Save className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
            {view === 'save' ? 'Save Track' : 'Music Library'}
          </DialogTitle>
          <DialogDescription>
            {view === 'save'
              ? 'Save your current composition to your local library.'
              : 'Manage and load your saved compositions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {view === 'save' ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="My Awesome Beat"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collection" className="text-right">
                  Collection
                </Label>
                <Input
                  id="collection"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. Techno, Ambient"
                />
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {tracks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No tracks saved yet.
                  </div>
                ) : (
                  tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{track.name}</h4>
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {track.collection}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(track.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleLoad(track.code)}>
                          <Play className="w-4 h-4 mr-1" /> Load
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(track.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {view === 'list' ? (
            <Button variant="outline" onClick={() => setView('save')}>
              <Save className="w-4 h-4 mr-2" /> Save Current
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setView('list')}>
              Back to Library
            </Button>
          )}

          {view === 'save' && <Button onClick={handleSave}>Save</Button>}
          {view === 'list' && (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LibraryDialog;
