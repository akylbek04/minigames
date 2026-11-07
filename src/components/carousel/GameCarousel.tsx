import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeaturedGames } from "../../api/minigames-api";
import { useAsyncResult } from "../../hooks/use-async-result";
import type { Game } from "../../types/game";
import { assetUrl } from "../../utils/asset-url";
import { formatCompactNumber } from "../../utils/format";
import { AsyncView } from "../feedback/AsyncContent";
import { EmptyState } from "../feedback/EmptyState";
import { Skeleton, SkeletonGroup } from "../feedback/Skeletons";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./carousel.scss";

const AUTOPLAY_DELAY = 4000;
const SWIPE_THRESHOLD = 40;
// A press held at least this long is a "pause and look", not a click.
const LONG_PRESS_DELAY = 500;

// A card's role comes from its circular distance to the active card; CSS
// sizes each role per breakpoint (edge cards only show on desktop) and
// animates the change, so cards grow toward the center and shrink away.
const ROLES = ["wide", "medium", "edge"] as const;

// Signed distance from `active` to `index` on a loop of `total` cards,
// in the range [-floor(total / 2), floor((total - 1) / 2)].
export function circularOffset(index: number, active: number, total: number): number {
  const forward = (((index - active) % total) + total) % total;
  return forward > total / 2 ? forward - total : forward;
}

// Autoplay that can pause and later resume with whatever time was left, as
// RSS-QS-2-3-1 requires for press-and-hold.
function useAutoplay(isEnabled: boolean, onTick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const timing = useRef({ deadline: 0, remaining: AUTOPLAY_DELAY });
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  const start = useCallback(function run(delay = AUTOPLAY_DELAY): void {
    clearTimeout(timer.current);
    timing.current = { deadline: performance.now() + delay, remaining: delay };
    timer.current = setTimeout(() => {
      tick.current();
      run();
    }, delay);
  }, []);

  const pause = useCallback((): void => {
    clearTimeout(timer.current);
    timing.current.remaining = Math.max(0, timing.current.deadline - performance.now());
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    start();
    return () => clearTimeout(timer.current);
  }, [isEnabled, start]);

  return { restart: start, pause, resume: () => start(timing.current.remaining) };
}

function CarouselSkeleton() {
  // Placeholder slots in the same roles as a loaded carousel, so the skeleton
  // has the real layout at every breakpoint.
  const roles = ["edge", "medium", "wide", "medium", "edge"];
  return (
    <SkeletonGroup label="Loading featured games…">
      <ul className="carousel__track" aria-hidden="true">
        {roles.map((role, index) => (
          <li key={index} className="carousel__slot" data-role={role}>
            <Skeleton className="carousel__card carousel__card--skeleton" />
          </li>
        ))}
      </ul>
    </SkeletonGroup>
  );
}

interface TrackProps {
  games: Game[];
  activeIndex: number;
  onPressStart: (event: React.PointerEvent) => void;
  shouldSuppressClick: { current: boolean };
  onOpenDetails: (slug: string) => void;
}

function CarouselTrack({
  games,
  activeIndex,
  onPressStart,
  shouldSuppressClick,
  onOpenDetails,
}: TrackProps) {
  return (
    <ul
      className="carousel__track"
      onPointerDown={onPressStart}
      // Browsers' native image drag would swallow a mouse swipe.
      onDragStart={(event) => event.preventDefault()}
    >
      {games.map((game, index) => {
        const offset = circularOffset(index, activeIndex, games.length);
        const distance = Math.abs(offset);
        return (
          <li
            key={game.slug}
            className="carousel__slot"
            data-role={distance < ROLES.length ? ROLES[distance] : "hidden"}
            style={{ order: offset }}
          >
            <button
              type="button"
              className="carousel__card"
              aria-label={game.name}
              data-slug={game.slug}
              onClick={() => {
                if (shouldSuppressClick.current) {
                  shouldSuppressClick.current = false;
                  return;
                }
                onOpenDetails(game.slug);
              }}
            >
              <img src={assetUrl(game.cardImage)} alt="" className="carousel__card-image" />
              <span className="carousel__card-info" aria-hidden="true">
                <span className="carousel__card-title">{game.name}</span>
                <span className="carousel__card-stats">
                  <span className="carousel__card-rating">
                    <MaterialIcon name="star" className="carousel__card-icon" />
                    {game.rating}
                  </span>
                  <span className="carousel__card-likes">
                    <MaterialIcon name="favorite" className="carousel__card-icon" />
                    {formatCompactNumber(game.likesCount)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function GameCarousel({ onOpenDetails }: { onOpenDetails: (slug: string) => void }) {
  const result = useAsyncResult<Game[]>({
    subject: "featured games",
    requestKey: "featured",
    request: fetchFeaturedGames,
  });
  const games = result.status === "ready" ? result.data : [];
  const total = games.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplay = useAutoplay(total > 0, () => setActiveIndex((index) => (index + 1) % total));

  function stepAndRestart(direction: 1 | -1): void {
    setActiveIndex((index) => (index + direction + total) % total);
    autoplay.restart();
  }

  // Press-and-hold pauses autoplay. Releasing without a swipe resumes the
  // remaining countdown; a swipe steps and starts a fresh 4s countdown.
  const press = useRef<{ x: number; time: number }>(undefined);
  const shouldSuppressClick = useRef(false);

  function onPressStart(event: React.PointerEvent): void {
    if (!event.isPrimary) {
      return;
    }
    press.current = { x: event.clientX, time: performance.now() };
    shouldSuppressClick.current = false;
    autoplay.pause();
  }

  const onPressEnd = (event: PointerEvent): void => {
    const start = press.current;
    if (!start || !event.isPrimary) {
      return;
    }
    press.current = undefined;
    const deltaX = event.clientX - start.x;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      shouldSuppressClick.current = true;
      stepAndRestart(deltaX < 0 ? 1 : -1);
    } else {
      shouldSuppressClick.current = performance.now() - start.time >= LONG_PRESS_DELAY;
      autoplay.resume();
    }
  };
  const onPressCancel = (): void => {
    if (!press.current) {
      return;
    }
    press.current = undefined;
    autoplay.resume();
  };

  // The latest handlers, installed once on the document so a press that ends
  // outside the track still counts.
  const handlers = useRef({ onPressEnd, onPressCancel });
  useEffect(() => {
    handlers.current = { onPressEnd, onPressCancel };
  });
  useEffect(() => {
    const end = (event: PointerEvent): void => handlers.current.onPressEnd(event);
    const cancel = (): void => handlers.current.onPressCancel();
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", cancel);
    return () => {
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", cancel);
    };
  }, []);

  const hasSlides = total > 0;
  return (
    <section className="carousel" aria-label="New Games">
      <div className="carousel__inner">
        <div className="carousel__header">
          <h2 className="carousel__title">New Games</h2>
          <div className="carousel__nav">
            <button
              type="button"
              className="carousel__arrow"
              aria-label="Previous games"
              disabled={!hasSlides}
              onClick={() => stepAndRestart(-1)}
            >
              <MaterialIcon name="arrow_back" />
            </button>
            <button
              type="button"
              className="carousel__arrow carousel__arrow--filled"
              aria-label="Next games"
              disabled={!hasSlides}
              onClick={() => stepAndRestart(1)}
            >
              <MaterialIcon name="arrow_forward" />
            </button>
          </div>
        </div>
        <AsyncView
          result={result}
          className="carousel__stage"
          renderLoading={() => <CarouselSkeleton />}
          isEmpty={(list) => list.length === 0}
          renderEmpty={() => (
            <EmptyState
              title="No featured games yet"
              message="New games will show up here as soon as they are featured."
              icon="sports_esports"
            />
          )}
          renderData={(list) => (
            <CarouselTrack
              games={list}
              activeIndex={activeIndex}
              onPressStart={onPressStart}
              shouldSuppressClick={shouldSuppressClick}
              onOpenDetails={onOpenDetails}
            />
          )}
        />
      </div>
    </section>
  );
}
