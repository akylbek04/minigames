import { useIsMediaMatch } from "../../hooks/use-is-media-match";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./pagination.scss";

// Figma shows at most 4 page buttons from tablet up and 3 on mobile.
const MAX_VISIBLE_WIDE = 4;
const MAX_VISIBLE_MOBILE = 3;

// First page of a window of `size` pages that keeps `active` as centered as
// the ends allow.
export function visiblePageStart(active: number, total: number, size: number): number {
  const centered = active - Math.floor((size - 1) / 2);
  return Math.max(1, Math.min(centered, total - size + 1));
}

interface PaginationNavProps {
  page: number;
  totalPages: number;
  // Picking a page only reports it; the URL then decides what is shown.
  onSelect: (page: number) => void;
}

// An empty result still shows page 1 with both arrows (RSS-QS-3-2-4).
export function PaginationNav({ page, totalPages, onSelect }: PaginationNavProps) {
  const isWide = useIsMediaMatch("(min-width: 768px)");
  const total = Math.max(1, totalPages);
  const active = Math.min(Math.max(1, page), total);
  const size = Math.min(total, isWide ? MAX_VISIBLE_WIDE : MAX_VISIBLE_MOBILE);
  const start = visiblePageStart(active, total, size);

  return (
    <nav className="pagination" aria-label="Library pages">
      <button
        type="button"
        className="pagination__button"
        aria-label="Previous page"
        disabled={active <= 1}
        onClick={() => onSelect(active - 1)}
      >
        <MaterialIcon name="chevron_left" />
      </button>
      <ul className="pagination__pages">
        {Array.from({ length: size }, (_, index) => {
          const number = start + index;
          return (
            <li key={number}>
              <button
                type="button"
                className="pagination__button"
                aria-label={`Page ${number}`}
                aria-current={number === active ? "page" : undefined}
                onClick={() => onSelect(number)}
              >
                {number}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="pagination__button"
        aria-label="Next page"
        disabled={active >= total}
        onClick={() => onSelect(active + 1)}
      >
        <MaterialIcon name="chevron_right" />
      </button>
    </nav>
  );
}
