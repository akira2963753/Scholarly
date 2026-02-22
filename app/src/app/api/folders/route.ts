import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await db.select().from(folders).where(eq(folders.userId, userId));
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    const [folder] = await db.insert(folders).values({ name, userId }).returning();
    return NextResponse.json(folder, { status: 201 });
}
