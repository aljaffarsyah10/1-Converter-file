import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ToolCard } from "@/components/shared/ToolCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TOOLS_CATALOG } from "@/data/tools";
import { ToolCategory } from "@/types/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

const CATEGORIES: Array<"All" | ToolCategory> = [
  "All",
  "PDF Tools",
  "Document",
  "Image",
  "Archive",
];

export const AllToolsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.acceptedFormats.some((fmt) => fmt.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <PageContainer>
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-2 border-b">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-8 text-xs font-medium"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools or formats..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Tools Grid / Empty State */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SlidersHorizontal}
          title="No converters found"
          description={`No tools match "${searchQuery}". Try selecting another category or clearing your query.`}
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedCategory("All");
            setSearchQuery("");
          }}
        />
      )}
    </PageContainer>
  );
};

