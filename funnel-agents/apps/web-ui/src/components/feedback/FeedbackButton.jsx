import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton({ 
  clientId, 
  feedbackType, 
  relatedId, 
  title,
  variant = "outline",
  size = "sm"
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
      >
        <Star className="w-4 h-4 mr-2" />
        Rate This
      </Button>
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clientId={clientId}
        feedbackType={feedbackType}
        relatedId={relatedId}
        title={title}
      />
    </>
  );
}