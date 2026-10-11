import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { normalizeLmsToken } from "@/lib/lms-token";

export async function POST(request: Request) {
	try {
		const { platform_name, token } = (await request.json()) as {
			platform_name?: string;
			token?: string;
		};

		const normalizedToken = normalizeLmsToken(token);
		if (!platform_name || !normalizedToken) {
			return NextResponse.json(
				{ error: "platform_name and token are required" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data, error } = await supabase.rpc("store_lms_token", {
			p_platform_name: platform_name,
			p_token: normalizedToken,
		});

		if (error) {
			return NextResponse.json(
				{ error: "Secure storage failed", details: error.message },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true, connection_id: data });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";

		return NextResponse.json(
			{ error: "Secure storage failed", details: message },
			{ status: 500 }
		);
	}
}

