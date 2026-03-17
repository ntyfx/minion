"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button, Flex, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Flex
          vertical
          align="center"
          justify="center"
          gap={16}
          style={{ height: "100dvh", padding: 40 }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Something went wrong
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ maxWidth: 480, textAlign: "center" }}
          >
            {process.env.NODE_ENV === "development"
              ? this.state.error.message
              : "An unexpected error occurred. Please try again."}
          </Typography.Text>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </Flex>
      );
    }

    return this.props.children;
  }
}
