import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = async () => {
  const session = await getServerSession(authOptions);
  return Response.json({ address: (session as any)?.address ?? null });
};