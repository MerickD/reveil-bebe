import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listNameSuggestions } from "@/lib/name-suggestions-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const suggestions = await listNameSuggestions();
  return NextResponse.json({ suggestions });
}
