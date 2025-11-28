import React from "react";
import { Alert, Box } from "@mui/material";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    if (this.props.onError) this.props.onError(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            Something went wrong! <br />
            {typeof this.state.error === "string"
              ? this.state.error
              : this.state.error?.message || JSON.stringify(this.state.error)}
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}