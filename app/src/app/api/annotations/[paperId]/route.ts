import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/db";
import { highlights, notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId } = await params;

    const [paperHighlights, paperNotes] = await Promise.all([
        db.select().from(highlights).where(and(eq(highlights.paperId, paperId), eq(highlights.userId, userId))),
        db.select().from(notes).where(and(eq(notes.paperId, paperId), eq(notes.userId, userId))),
    ]);

    return NextResponse.json({ highlights: paperHighlights, notes: paperNotes });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId } = await params;
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "highlight") {
        const [h] = await db.insert(highlights).values({ ...data, paperId, userId }).returning();
        return NextResponse.json(h, { status: 201 });
    }

    if (type === "note") {
        const [n] = await db.insert(notes).values({ ...data, paperId, userId }).returning();
        return NextResponse.json(n, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId } = await params;
    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "highlight") {
        const [h] = await db
            .update(highlights)
            .set(data)
            .where(and(eq(highlights.id, id), eq(highlights.paperId, paperId), eq(highlights.userId, userId)))
            .returning();
        return NextResponse.json(h);
    }

    if (type === "note") {
        const [n] = await db
            .update(notes)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(notes.id, id), eq(notes.paperId, paperId), eq(notes.userId, userId)))
            .returning();
        return NextResponse.json(n);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId } = await params;
    const { type, id } = await req.json();

    if (type === "highlight") {
        await db.delete(highlights).where(and(eq(highlights.id, id), eq(highlights.paperId, paperId), eq(highlights.userId, userId)));
        await db.delete(notes).where(and(eq(notes.highlightId, id), eq(notes.paperId, paperId), eq(notes.userId, userId)));
        return NextResponse.json({ success: true });
    }

    if (type === "note") {
        await db.delete(notes).where(and(eq(notes.id, id), eq(notes.paperId, paperId), eq(notes.userId, userId)));
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
