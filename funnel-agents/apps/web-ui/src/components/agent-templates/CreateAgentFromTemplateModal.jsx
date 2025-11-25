

import AddAgentSheet from '../agents/AddAgentSheet';

export default function CreateAgentFromTemplateModal({ open, onOpenChange, template }) {
  // Just redirect to AddAgentSheet with template
  if (!template) return null;

  return (
    <AddAgentSheet
      open={open}
      onOpenChange={onOpenChange}
      template={template}
    />
  );
}