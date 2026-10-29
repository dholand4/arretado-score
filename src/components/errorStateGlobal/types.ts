export interface IErrorStateProps {
  title?: string;
  error: unknown;
  onRetry?: () => void;
}
