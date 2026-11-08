import { getProfileName } from "../../auth/profile";
import type { AppSession } from "../../auth/session";
import { UserAvatar } from "../../components/user-avatar/UserAvatar";
import { useProfile } from "../../hooks/use-profile";
import { useSession } from "../../hooks/use-session";
import { ACHIEVEMENTS } from "../../profile/achievements";
import type { ProfileData } from "../../profile/profile-store";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { Badges } from "./Badges";
import { History } from "./History";
import { Section } from "./Section";
import { Settings } from "./Settings";
import { Stats } from "./Stats";
import "./profile-page.scss";

function ProfileContent({ session, data }: { session: AppSession; data: ProfileData }) {
  const unlockedCount = Object.keys(data.unlocked).length;
  return (
    <div className="profile-page__content">
      <div className="profile-page__hero">
        <UserAvatar profile={session} className="profile-page__avatar-large" />
        <div>
          <p className="profile-page__name">{getProfileName(session)}</p>
          <p className="profile-page__email">{session.email}</p>
          <p className="profile-page__summary">
            {unlockedCount} of {ACHIEVEMENTS.length} badges unlocked
          </p>
        </div>
      </div>
      <Section title="Statistics" id="profile-stats">
        <Stats data={data} />
      </Section>
      <Section title="Achievements" id="profile-badges">
        <Badges data={data} />
      </Section>
      <Section title="Customize your avatar" id="profile-avatar">
        <AvatarCustomizer
          key={data.avatar ? `${data.avatar.icon}|${data.avatar.color}` : "default"}
          email={session.email}
          current={data.avatar}
        />
      </Section>
      <Section title="Recent activity" id="profile-history">
        <History data={data} email={session.email} />
      </Section>
      <Section title="Settings" id="profile-settings">
        <Settings email={session.email} />
      </Section>
    </div>
  );
}

// Only for signed-in users: guests never get here (the route sends them
// Home with Auth open), and ending the session sends the user Home.
export function ProfilePage() {
  const session = useSession();
  const data = useProfile(session?.email);
  return (
    <main className="profile-page">
      <title>Your Profile — MiniGames</title>
      <div className="profile-page__inner">
        <h1 className="profile-page__title">Your profile</h1>
        {session && data && <ProfileContent session={session} data={data} />}
      </div>
    </main>
  );
}
