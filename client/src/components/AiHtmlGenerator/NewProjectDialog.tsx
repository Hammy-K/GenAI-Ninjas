import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NewProjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
};

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  open,
  onClose,
  onConfirmed,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بدء مشروع جديد</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من أنك تريد البدء من جديد؟ سيؤدي هذا إلى حذف الكود
            الحالي.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            الغاء
          </Button>
          <Button onClick={onConfirmed}>بدء مشروع جديد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
