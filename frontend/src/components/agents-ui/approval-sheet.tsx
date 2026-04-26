"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ApprovalData {
  title: string;
  description: string;
  details: Record<string, any>;
}

export function ApprovalSheet({ approval, onAccept, onCancel }: { 
  approval: ApprovalData | null, 
  onAccept: () => void, 
  onCancel: () => void 
}) {
  return (
    <Dialog open={!!approval} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approval?.title || "Approval Required"}</DialogTitle>
          <DialogDescription>
            {approval?.description}
          </DialogDescription>
        </DialogHeader>
        {approval?.details && (
          <div className="py-4 space-y-2">
            {Object.entries(approval.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onAccept}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
