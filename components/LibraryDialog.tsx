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
import {
  Trash2,
  Play,
  FolderOpen,
  Save,
  FolderPlus,
  ArrowLeft,
  MoreVertical,
  FolderInput,
  Music,
} from 'lucide-react';
import {
  saveTrack,
  getTracks,
  deleteTrack,
  getCollections,
  deleteCollection,
  updateTrackCollection,
} from '../services/storageService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
  mode: 'save' | 'load';
}

const LibraryDialog: React.FC<LibraryDialogProps> = ({
  open,
  onOpenChange,
  currentCode,
  onLoadCode,
  mode,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [view, setView] = useState<'collections' | 'tracks' | 'save'>('collections');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');

  const loadData = async () => {
    const loadedTracks = await getTracks();
    const loadedCollections = await getCollections();
    setTracks(loadedTracks.sort((a, b) => b.createdAt - a.createdAt));
    setCollections(loadedCollections);
  };

  useEffect(() => {
    if (open) {
      loadData();
      if (mode === 'save') {
        setView('save');
        setName('');
        setNewCollectionName('');
      } else {
        setView('collections');
        setSelectedCollection(null);
      }
    }
  }, [open, mode]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const targetCollection = newCollectionName.trim() || 'Unsorted';
    await saveTrack({
      name,
      code: currentCode,
      collection: targetCollection,
    });
    await loadData();
    setView('collections');
    if (mode === 'save') {
      onOpenChange(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    await deleteTrack(id);
    await loadData();
  };

  const handleDeleteCollection = async (collectionName: string) => {
    if (confirm(`Are you sure you want to delete "${collectionName}" and all its tracks?`)) {
      await deleteCollection(collectionName);
      await loadData();
      if (selectedCollection === collectionName) {
        setView('collections');
        setSelectedCollection(null);
      }
    }
  };

  const handleMoveTrack = async (trackId: string, targetCollection: string) => {
    await updateTrackCollection(trackId, targetCollection);
    await loadData();
  };

  const handleLoad = (code: string) => {
    onLoadCode(code);
    onOpenChange(false);
  };

  const filteredTracks = selectedCollection
    ? tracks.filter((t) => t.collection === selectedCollection)
    : tracks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {view === 'save' && <Save className="w-5 h-5 text-purple-400" />}
            {view === 'collections' && <FolderOpen className="w-5 h-5 text-purple-400" />}
            {view === 'tracks' && <Music className="w-5 h-5 text-purple-400" />}

            {view === 'save' ? 'Save Track' : view === 'tracks' ? selectedCollection : 'Library'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {view === 'save'
              ? 'Save your masterpiece to a collection.'
              : view === 'tracks'
                ? `${filteredTracks.length} tracks`
                : 'Manage your collections and tracks.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {view === 'save' ? (
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Track Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Beat"
                  className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collection">Collection</Label>
                <div className="flex gap-2">
                  <Input
                    id="collection"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g. Techno, Ambient (or select below)"
                    className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                  />
                </div>
                {collections.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {collections.map((c) => (
                      <div key={c} onClick={() => setNewCollectionName(c)}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                        >
                          {c}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : view === 'collections' ? (
            <ScrollArea className="flex-1 -mr-4 pr-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Create New Collection Placeholder (Visual only, creates on save) */}
                <div
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
                  onClick={() => {
                    setView('save');
                    setNewCollectionName('');
                  }}
                >
                  <FolderPlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">New Collection</span>
                </div>

                {collections.map((col) => (
                  <div
                    key={col}
                    className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20 transition-all cursor-pointer group relative"
                    onClick={() => {
                      setSelectedCollection(col);
                      setView('tracks');
                    }}
                  >
                    <FolderOpen className="w-8 h-8 text-purple-500 group-hover:text-purple-400 transition-colors" />
                    <div>
                      <h3 className="font-bold truncate text-zinc-200 group-hover:text-white">
                        {col}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {tracks.filter((t) => t.collection === col).length} tracks
                      </p>
                    </div>

                    {/* Collection Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-zinc-500 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(col);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1 -mr-4 pr-4">
              <div className="space-y-2">
                {filteredTracks.length === 0 ? (
                  <div className="text-center text-zinc-500 py-10">
                    No tracks in this collection.
                  </div>
                ) : (
                  filteredTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                    >
                      <div
                        className="flex-1 min-w-0 mr-4 cursor-pointer"
                        onClick={() => handleLoad(track.code)}
                      >
                        <h4 className="font-semibold truncate text-zinc-200 group-hover:text-purple-300 transition-colors">
                          {track.name}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {new Date(track.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          onClick={() => handleLoad(track.code)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-zinc-500 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuLabel>Move to...</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            {collections
                              .filter((c) => c !== track.collection)
                              .map((col) => (
                                <DropdownMenuItem
                                  key={col}
                                  onClick={() => handleMoveTrack(track.id, col)}
                                >
                                  <FolderInput className="w-4 h-4 mr-2" /> {col}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
                              onClick={() => handleDeleteTrack(track.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Track
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between gap-2">
          {view === 'tracks' ? (
            <Button
              variant="ghost"
              onClick={() => setView('collections')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : view === 'save' ? (
            <Button
              variant="ghost"
              onClick={() => setView('collections')}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
          ) : (
            <div /> // Spacer
          )}

          {view === 'save' ? (
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-500 text-white">
              Save Track
            </Button>
          ) : (
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
