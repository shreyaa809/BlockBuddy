import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: adminProfile, error: adminCheckError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (adminCheckError || !adminProfile || adminProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Only admin can create worker accounts" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, email, password, employee_id } = await req.json();

    if (!name || !email || !password || !employee_id) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          employee_id,
          role: "worker",
        },
      });

    if (createUserError || !createdUser.user) {
      return new Response(JSON.stringify({ error: createUserError?.message || "Could not create auth user" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: profileInsertError } = await adminClient.from("profiles").insert({
      id: createdUser.user.id,
      name,
      email,
      role: "worker",
      employee_id,
      room_number: null,
    });

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return new Response(JSON.stringify({ error: profileInsertError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Worker account created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});