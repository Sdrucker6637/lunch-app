import { NextResponse } from "next/server";
import { getOfficeLocation } from "@/lib/office";

// Tiny read-only endpoint so client components (the map) can center on the
// office without needing server-only env vars exposed to the browser.
export async function GET() {
  const office = await getOfficeLocation();
  return NextResponse.json(office);
}
