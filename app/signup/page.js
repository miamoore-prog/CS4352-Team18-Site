"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../components/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      signup({ name: username, email, password });
      router.push("/profile");
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Button type="submit" className="w-full">Create account</Button>
        </form>
      </Card>
    </div>
  );
}


