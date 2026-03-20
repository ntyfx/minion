"use client";

import { memo, useState } from "react";
import { Button, Tag } from "antd";
import {
  CloseCircleOutlined,
  SendOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { ErrorReportData } from "@/lib/response-parser";

interface ErrorReportCardProps {
  error: ErrorReportData;
  onAction?: (message: string) => void;
}

export const ErrorReportCard = memo(function ErrorReportCard({
  error,
  onAction,
}: ErrorReportCardProps) {
  const t = useTranslations("richContent");
  const [sent, setSent] = useState(false);

  const handleRetry = () => {
    if (error.recovery && onAction) {
      setSent(true);
      onAction(error.recovery);
    }
  };

  return (
    <div className="rich-error-card">
      <div className="rich-error-header">
        <CloseCircleOutlined style={{ fontSize: 16 }} />
        <span className="rich-error-title">{error.title}</span>
      </div>

      <div className="rich-error-fields">
        {error.fields.map((f, i) => (
          <div key={i} className="rich-error-field">
            <span className="rich-error-field-label">{f.label}</span>
            <span className="rich-error-field-value">{f.value}</span>
          </div>
        ))}
      </div>

      {error.recovery && (
        <div className="rich-error-actions">
          {sent ? (
            <Tag color="success" icon={<CheckOutlined />} style={{ fontSize: 12 }}>
              {t("errorSent")}
            </Tag>
          ) : (
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={handleRetry}
            >
              {t("errorRetry")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
