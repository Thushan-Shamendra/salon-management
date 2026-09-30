import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1>Customer Account</h1>
      <p>Welcome, {user?.name}</p>
      <p>{user?.email}</p>
    </main>
  );
}