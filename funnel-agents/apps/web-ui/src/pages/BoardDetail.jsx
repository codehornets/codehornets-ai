import { useState, useEffect, useRef } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import Whiteboard from '../components/boards/Whiteboard';
import { ArrowLeft, Save } from 'lucide-react';

export default function BoardDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('id');
  const [canvasData, setCanvasData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimerRef = useRef(null);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      return await client.entities.Board.filter({ id: boardId });
    },
    enabled: !!boardId,
  });

  const board = boards[0];

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => client.auth.me(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => client.entities.Board.update(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setHasUnsavedChanges(false);
      toast.success('Board saved');
    },
    onError: (error) => {
      console.error('Failed to save board:', error);
      toast.error('Failed to save board');
    },
  });

  const handleSave = async () => {
    if (!canvasData || !board) return;

    // Store tldraw data in the board
    await updateMutation.mutateAsync({
      // Store the full tldraw data
      tldraw_data: canvasData.tldraw_snapshot || canvasData,
      // Keep legacy field for backwards compatibility
      excalidraw_data: {
        elements: [],
        format: 'tldraw',
        migrated: true,
      },
      last_edited_by: user?.email,
    });
  };

  // Auto-save after 10 seconds of changes (reduced from 30s for better UX)
  useEffect(() => {
    if (hasUnsavedChanges && canvasData) {
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Set new timer
      saveTimerRef.current = setTimeout(() => handleSave(), 10000);
      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    }
  }, [hasUnsavedChanges, canvasData]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
        <p className="text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Board not found</p>
        <Button onClick={() => navigate(createPageUrl('Boards'))}>
          Back to Boards
        </Button>
      </div>
    );
  }

  // Get initial data - prefer tldraw format, fall back to legacy
  const getInitialData = () => {
    if (board.tldraw_data) {
      return board.tldraw_data;
    }
    // Legacy data - will be ignored, tldraw starts fresh
    return board.excalidraw_data || { elements: [] };
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl('Boards'))}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {board.name}
          </h1>
          {hasUnsavedChanges && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--bg-warning)',
                color: 'var(--text-warning)',
              }}
            >
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Whiteboard Canvas */}
      <div className="flex-1">
        <Whiteboard
          boardId={boardId}
          initialData={getInitialData()}
          onChange={(data) => {
            setCanvasData(data);
            setHasUnsavedChanges(true);
          }}
        />
      </div>
    </div>
  );
}