import { NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { errorMonitor } from "stream";
import { checkAuth } from "@/lib/auth/utils";

export async function GET(req: Request) {
  await checkAuth()
  try {
    const vehicles = await db.vehicle.findMany({});

    return NextResponse.json({ data: vehicles }, { status: 200 });
  } catch (error) {
    console.log(errorMonitor);
    return NextResponse.json(
      { error: "Form submission failed" },
      { status: 500 }
    );
  }
}
