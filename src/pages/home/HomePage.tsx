import { GameCarousel } from "../../components/carousel/GameCarousel";
import { GameDevSection } from "../../components/game-dev-section/GameDevSection";
import { HeroSection } from "../../components/hero/HeroSection";
import { LeaderboardSection } from "../../components/leaderboard/LeaderboardSection";
import { useOverlay } from "../../hooks/use-overlay";

// The data sections load when Home is shown; a failed one keeps its own
// retry button.
export function HomePage() {
  const game = useOverlay("game");
  return (
    <main className="home-page">
      <title>MiniGames — Take a Short Break &amp; Have Fun</title>
      <HeroSection />
      <GameCarousel onOpenDetails={game.open} />
      <LeaderboardSection />
      <GameDevSection />
    </main>
  );
}
