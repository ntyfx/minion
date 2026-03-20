"use client";

import { memo, useState } from "react";
import { Button, Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReadOutlined,
  EditOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { PlanData } from "@/lib/response-parser";

interface PlanReviewCardProps {
  plan: PlanData;
  onAction?: (message: string) => void;
}

const STEP_TYPE_CONFIG = {
  read: { color: "blue", icon: <ReadOutlined /> },
  write: { color: "orange", icon: <EditOutlined /> },
  unknown: { color: "default", icon: null },
} as const;

export const PlanReviewCard = memo(function PlanReviewCard({
  plan,
  onAction,
}: PlanReviewCardProps) {
  const t = useTranslations("richContent");
  const [acted, setActed] = useState<"approved" | "rejected" | null>(null);

  const handleApprove = () => {
    setActed("approved");
    onAction?.(t("planApproveMessage"));
  };

  const handleReject = () => {
    setActed("rejected");
    onAction?.(t("planRejectMessage"));
  };

  return (
    <div className="rich-plan-card">
      <div className="rich-plan-header">
        <span className="rich-plan-title">{plan.title}</span>
        <Tag color="processing" style={{ margin: 0, fontSize: 11 }}>
          {t("planStepCount", { count: plan.steps.length })}
        </Tag>
      </div>

      <div className="rich-plan-steps">
        {plan.steps.map((step) => {
          const cfg = STEP_TYPE_CONFIG[step.type];
          return (
            <div key={step.index} className="rich-plan-step">
              <span className="rich-plan-step-index">{step.index}</span>
              <div className="rich-plan-step-body">
                <span className="rich-plan-step-label">
                  {step.label.replace(/\*+/g, "").replace(/\[?\s*(?:read|write)\s*]?\s*/gi, "")}
                </span>
                <span className="rich-plan-step-tags">
                  {step.type !== "unknown" && (
                    <Tag
                      color={cfg.color}
                      icon={cfg.icon}
                      style={{ margin: 0, fontSize: 11 }}
                    >
                      {t(step.type === "read" ? "stepRead" : "stepWrite")}
                    </Tag>
                  )}
                  {step.hasBudgetRisk && (
                    <Tooltip title={t("budgetWarning")}>
                      <Tag
                        color="error"
                        icon={<WarningOutlined />}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {t("budgetWarning")}
                      </Tag>
                    </Tooltip>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {plan.warnings.length > 0 && (
        <div className="rich-plan-warnings">
          <WarningOutlined style={{ color: "var(--warning)", flexShrink: 0 }} />
          <span>
            {plan.warnings.map((w, i) => (
              <span key={i}>
                {w}
                {i < plan.warnings.length - 1 && "; "}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="rich-plan-actions">
        {acted === "approved" && (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>
            {t("planApproved")}
          </Tag>
        )}
        {acted === "rejected" && (
          <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 12 }}>
            {t("planRejected")}
          </Tag>
        )}
        {!acted && (
          <>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              size="small"
            >
              {t("planApprove")}
            </Button>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              size="small"
              danger
            >
              {t("planReject")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
});
