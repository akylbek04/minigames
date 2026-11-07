import { useEffect, useRef } from "react";
import type { AsyncResult } from "../../hooks/use-async-result";
import type { Category } from "../../types/game";
import { enableDragScroll } from "../../utils/drag-scroll";
import { AsyncView } from "../feedback/AsyncContent";
import { EmptyState } from "../feedback/EmptyState";
import { Skeleton, SkeletonGroup } from "../feedback/Skeletons";
import "./filter-chips.scss";

const SKELETON_CHIP_COUNT = 7;

function ChipsSkeleton() {
  return (
    <SkeletonGroup label="Loading categories…">
      <div className="filter-chips" aria-hidden="true">
        {Array.from({ length: SKELETON_CHIP_COUNT }, (_, index) => (
          <Skeleton key={index} className="filter-chips__chip filter-chips__chip--skeleton" />
        ))}
      </div>
    </SkeletonGroup>
  );
}

interface ChipListProps {
  categories: Category[];
  active: string;
  onSelect: (slug: string) => void;
}

function ChipList({ categories, active, onSelect }: ChipListProps) {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => (list.current ? enableDragScroll(list.current) : undefined), []);

  return (
    <ul ref={list} className="filter-chips">
      {categories.map((category) => (
        <li key={category.slug}>
          <button
            type="button"
            className="filter-chips__chip"
            data-slug={category.slug}
            aria-pressed={category.slug === active}
            onClick={() => onSelect(category.slug)}
          >
            {category.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface FilterChipsProps {
  result: AsyncResult<Category[]>;
  // The category the URL (or the API default) selects.
  active: string;
  // A chip click only reports the choice; the URL then decides what is active.
  onSelect: (slug: string) => void;
}

// Category chips rendered from GET /api/categories.
export function FilterChips({ result, active, onSelect }: FilterChipsProps) {
  return (
    <div className="filter-chips__wrapper" role="group" aria-label="Game categories">
      <AsyncView
        result={result}
        className="filter-chips__content"
        renderLoading={() => <ChipsSkeleton />}
        renderData={(categories) => (
          <ChipList categories={categories} active={active} onSelect={onSelect} />
        )}
        isEmpty={(categories) => categories.length === 0}
        renderEmpty={() => (
          <EmptyState title="No categories" message="All games are listed below." icon="category" />
        )}
      />
    </div>
  );
}
