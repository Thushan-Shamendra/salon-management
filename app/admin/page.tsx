import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1>Admin Portal</h1>
      <p>Welcome, {user?.name}</p>
    </main>
  );
}