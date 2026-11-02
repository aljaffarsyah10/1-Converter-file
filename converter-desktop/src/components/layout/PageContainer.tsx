import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <main
      className={`flex-1 overflow-y-auto p-6 md:p-8 bg-background/50 ${className}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">{children}</div>
    </main>
  );
};

