import illustration from "../../assets/images/illustration-side.png";
import { icons } from "../icons/icons";
import { InlineIcon } from "../icons/InlineIcon";
import "./game-dev-section.scss";

export function GameDevSection() {
  return (
    <section className="game-dev" aria-label="Are you a game developer?">
      <div className="game-dev__inner">
        <img
          src={illustration}
          alt="Illustration of a game developer's desk setup"
          className="game-dev__illustration"
        />
        <div className="game-dev__card">
          <div className="game-dev__content">
            <h2 className="game-dev__title">Are You a Game Developer?</h2>
            <p className="game-dev__text">
              Want to see your game on MiniGames? We&apos;re always looking for fun, engaging mini
              games to add to our platform. Submit your game and reach thousands of players!
            </p>
            <button type="button" className="btn btn--filled game-dev__cta">
              <InlineIcon markup={icons.upload} className="game-dev__cta-icon" />
              Submit Form
            </button>
            <p className="game-dev__contact">
              or contact us at{" "}
              <a href="mailto:developers@minigames.com">developers@minigames.com</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
