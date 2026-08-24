import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const conv = db.getConversation(id);
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json(conv);
  }

  const list = db.getConversations();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body.title || "New Weather Discussion";
    const newConv = db.createConversation(title);
    return NextResponse.json(newConv);
  } catch {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const deleted = db.deleteConversation(id);
  return NextResponse.json({ success: deleted });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;
    if (!id || !title) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const updated = db.renameConversation(id, title);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
