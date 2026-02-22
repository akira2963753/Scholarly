import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/db";
import { papers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await db.select().from(papers).where(eq(papers.userId, userId));
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const [paper] = await db
            .insert(papers)
            .values({ ...body, userId })
            .returning();
        return NextResponse.json(paper, { status: 201 });
    } catch (err) {
        console.error("Create paper error:", err);
        return NextResponse.json({ error: "Failed to create paper" }, { status: 500 });
    }
}
