import { NextRequest } from "next/server";
import { handleFeeSync } from "@/lib/admin/fee-sync-route";
export const maxDuration = 120;
export async function POST(request: NextRequest, { params }: { params: { id: string } }) { return handleFeeSync(request, params.id); }
