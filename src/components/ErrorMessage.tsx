import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  id = "error-message-card",
}) => {
  return (
    <div
      id={id}
      className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 my-3"
    >
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-rose-900 mb-0.5">{title}</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};
