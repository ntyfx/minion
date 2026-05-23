"use client";

import { useTranslations } from "next-intl";
import ErrorBoundary from "./error-boundary";

interface ErrorFallbackProps {
  message: string;
  buttonText: string;
  compact?: boolean;
}

function ErrorFallback({ message, buttonText, compact }: ErrorFallbackProps) {
  const safeMessage = message ?? "Something went wrong";
  const safeButtonText = buttonText ?? "Reload page";

  if (compact) {
    return (
      <div style={{ padding: 16, color: "var(--text-secondary)" }}>
        {safeMessage}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ height: "100%", padding: 40 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          {safeMessage}
        </p>
        <button
          className="icon-button"
          onClick={() => window.location.reload()}
          style={{ padding: "8px 16px", width: "auto" }}
        >
          {safeButtonText}
        </button>
      </div>
    </div>
  );
}

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  section: "chat" | "sidebar" | "dashboard" | "tokenReport";
}

function SectionErrorBoundary({ children, section }: SectionErrorBoundaryProps) {
  const t = useTranslations("errorBoundary");

  const isCompact = section === "sidebar";
  let message: string;
  let buttonText: string;

  try {
    message = t(`${section}.message`);
    buttonText = t(`${section}.retry`);
  } catch {
    message = "Something went wrong";
    buttonText = "Reload page";
  }

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          message={message}
          buttonText={buttonText}
          compact={isCompact}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return <SectionErrorBoundary section="chat">{children}</SectionErrorBoundary>;
}

export function SidebarErrorBoundary({ children }: { children: React.ReactNode }) {
  return <SectionErrorBoundary section="sidebar">{children}</SectionErrorBoundary>;
}

export function TokenReportErrorBoundary({ children }: { children: React.ReactNode }) {
  return <SectionErrorBoundary section="tokenReport">{children}</SectionErrorBoundary>;
}

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return <SectionErrorBoundary section="dashboard">{children}</SectionErrorBoundary>;
}

export { ErrorBoundary };
