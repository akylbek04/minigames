import { useNavigate } from "react-router";
import "./hero.scss";

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="hero" aria-label="Welcome">
      <div className="hero__inner">
        <div className="hero__card">
          <h1 className="hero__title">Take a Short Break &amp; Have Fun</h1>
          <p className="hero__text hero__text--short">
            Discover hundreds of curated casual mini-games right in your browser.
          </p>
          <p className="hero__text hero__text--long">
            Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle,
            match 3, farm, and board classics.
          </p>
          <button
            type="button"
            className="btn btn--filled hero__cta"
            onClick={() => void navigate("/library")}
          >
            Browse Library
          </button>
        </div>
      </div>
    </section>
  );
}
