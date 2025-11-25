import { Button } from '@/components/ui/button';
import { X, Tag, Users, FolderKanban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BulkActions({ selectedCount, onClearSelection, onBulkAction }) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-600 text-white rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="font-medium">{selectedCount} lead{selectedCount > 1 ? 's' : ''} selected</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-white hover:bg-blue-700 h-7"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <Users className="w-4 h-4 mr-2" />
              Change Owner
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem className="text-slate-300">Assign to me</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">Assign to Sales Agent</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <FolderKanban className="w-4 h-4 mr-2" />
              Add to Campaign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem className="text-slate-300">Q1 LinkedIn Campaign</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">Email Nurture Sequence</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkAction('tag')}
          className="text-white hover:bg-blue-700"
        >
          <Tag className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
      </div>
    </div>
  );
}