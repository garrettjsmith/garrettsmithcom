import { cookies } from "next/headers";
import { getActiveMember, type Member } from "./members.ts";
import { signToken, verifyToken } from "./signed.ts";

// The member cookie: who is signed in on the web. Set after checkout or from
// an emailed sign-in link. No passwords.

const COOKIE = "ag_member";
const MAX_AGE = 60 * 86_400;

export async function setMemberCookie(email: string): Promise<void> {
  (await cookies()).set(COOKIE, signToken("member", { email }, MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearMemberCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in member, if the cookie is valid and they're still paying. */
export async function currentMember(): Promise<Member | null> {
  const data = verifyToken<{ email: string }>("member", (await cookies()).get(COOKIE)?.value);
  return data ? getActiveMember(data.email) : null;
}
