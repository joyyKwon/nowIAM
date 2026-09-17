import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// 카카오는 "이 앱에 로그인 동의했음"을 카카오 계정 쪽에 기억하기 때문에,
// 탈퇴 시 연결 끊기(Unlink)를 호출하지 않으면 재가입해도 동의화면이 다시 뜨지 않는다.
// KAKAO_ADMIN_KEY는 Supabase 대시보드(Edge Functions > Secrets)에 등록된 값을 사용.
async function unlinkKakao(kakaoUserId: string): Promise<void> {
  const adminKey = Deno.env.get("KAKAO_ADMIN_KEY");
  if (!adminKey) return;

  try {
    await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${adminKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `target_id_type=user_id&target_id=${encodeURIComponent(kakaoUserId)}`,
    });
  } catch (e) {
    // 카카오 연결끊기가 실패해도 계정 삭제 자체는 계속 진행 (베스트 에포트)
    console.error("Kakao unlink failed:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증 정보가 없습니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 요청자 본인 확인 (요청에 담긴 사용자 토큰으로 신원 조회)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "인증에 실패했습니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 카카오로 로그인한 계정이면, 계정 삭제 전에 카카오 쪽 연결도 끊기
    const { data: fullUser } = await adminClient.auth.admin.getUserById(user.id);
    const kakaoIdentity = fullUser?.user?.identities?.find((i: any) => i.provider === "kakao");
    if (kakaoIdentity) {
      const kakaoUserId = kakaoIdentity.identity_data?.sub || kakaoIdentity.identity_data?.provider_id;
      if (kakaoUserId) {
        await unlinkKakao(kakaoUserId);
      }
    }

    // service_role 권한으로 계정 삭제 (profiles/posts/post_images는 FK CASCADE로 함께 삭제됨)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
