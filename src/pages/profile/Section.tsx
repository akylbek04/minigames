import type { ReactNode } from "react";

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section className="profile-page__section" aria-labelledby={id}>
      <h2 className="profile-page__section-title" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}
