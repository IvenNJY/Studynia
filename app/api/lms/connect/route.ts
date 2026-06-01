// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/server";

// export async function POST(request: Request) {
//   try {
//     const { platform_name, token } = await request.json();
//     const supabase = await createClient();

//     // The RPC handles: 
//     // 1. Identifying the user via auth.uid()
//     // 2. Saving to Vault
//     // 3. Saving the ID (ticket) to lms_connections
//     const { data, error } = await supabase.rpc("store_lms_token", {
//       p_platform_name: platform_name,
//       p_token: token,
//     });

//     if (error) throw error;

//     return NextResponse.json({ success: true, connection_id: data });
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: "Secure storage failed", details: error.message },
//       { status: 500 }
//     );
//   }
// }


