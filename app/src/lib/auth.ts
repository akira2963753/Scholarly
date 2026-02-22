import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type SessionWithId = {
    user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
};

export async function getSessionUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions) as SessionWithId | null;
    return session?.user?.id ?? null;
}
