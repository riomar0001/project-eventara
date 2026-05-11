"use client"

import { EVENT_CATEGORIES } from "@/constants/events"
import { EventCategory } from "@/types/event"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EventTabsProps {
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  categories?: EventCategory[]
}

export function EventTabs({
  selectedCategory,
  onCategoryChange,
  categories = EVENT_CATEGORIES,
}: EventTabsProps) {
  return (
    <Tabs
      value={selectedCategory}
      onValueChange={onCategoryChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4 lg:w-auto">
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="text-sm"
          >
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
