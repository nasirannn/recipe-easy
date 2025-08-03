"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  email?: string;
  subject?: string;
  body?: string;
  onConfirm?: () => void;
}

export const ContactDialog = ({
  open,
  onOpenChange,
  title,
  description,
  email = "annnb016@gmail.com",
  subject,
  body,
  onConfirm,
}: ContactDialogProps) => {
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations('contactDialog');
  
  // 使用翻译或默认值
  const dialogTitle = title || t('title');
  const dialogDescription = description || t('description');

  const handleSendEmail = () => {
    setIsSending(true);
    
    if (onConfirm) {
      // 如果有自定义确认函数，使用它
      onConfirm();
    } else {
      // 默认行为：构建邮件链接
      const mailSubject = subject || t('defaultSubject');
      const mailBody = body || t('defaultBody');
      const mailToLink = `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      
      // 尝试打开邮件客户端
      try {
        window.location.href = mailToLink;
      } catch (error) {
        console.error('Failed to open email client:', error);
      }
    }
    
    setIsSending(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending}
            className="flex items-center gap-2"
          >
            {isSending ? t('sending') : t('sendEmail')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 