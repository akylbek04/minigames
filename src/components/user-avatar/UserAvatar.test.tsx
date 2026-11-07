import { act, fireEvent, render } from "@testing-library/react";
import { expect, it } from "vitest";
import { saveAvatar } from "../../profile/profile-store";
import { UserAvatar } from "./UserAvatar";

const ana = { displayName: "Ana Maria", email: "ana@x.io" };

it("shows the photo, falling back to initials when it fails to load", () => {
  const { container } = render(<UserAvatar profile={{ ...ana, avatarUrl: "/a.png" }} />);
  const image = container.querySelector("img")!;
  expect(image.getAttribute("src")).toBe("/a.png");
  fireEvent.error(image);
  expect(container.textContent).toBe("AM");
  expect(container.querySelector("img")).toBeNull();
});

it("uses the email name, then a generic icon, when there is no usable name", () => {
  expect(
    render(<UserAvatar profile={{ displayName: "", email: "zoe@x.io" }} />).container.textContent,
  ).toBe("Z");
  expect(
    render(<UserAvatar profile={{ displayName: "~~~", email: "b@x.io" }} />).container.textContent,
  ).toBe("person");
});

it("prefers the avatar picked on the Profile page and follows changes", () => {
  const { container } = render(<UserAvatar profile={ana} />);
  act(() => saveAvatar(ana.email, { icon: "pets", color: 2 }));
  expect(container.textContent).toBe("pets");
  expect(container.querySelector(".user-avatar--color-3")).not.toBeNull();
  act(() => saveAvatar(ana.email, undefined));
  expect(container.textContent).toBe("AM");
});
