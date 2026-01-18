"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogOut, Activity, FolderOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Open<span className="text-emerald-500">Log</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {session.user.name || "Developer"}!
          </h2>
          <p className="text-zinc-400 mt-1">
            Here&apos;s an overview of your logging activity.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Total Logs (24h)
              </CardDescription>
              <CardTitle className="text-3xl text-white">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">
                Start sending logs to see data
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Error Rate
              </CardDescription>
              <CardTitle className="text-3xl text-white">0%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">No errors detected</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Active Services
              </CardDescription>
              <CardTitle className="text-3xl text-white">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">No services connected</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FolderOpen className="h-5 w-5 text-emerald-500" />
                Create Your First Project
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Set up a project to start collecting logs from your
                applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Create Project
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-emerald-500" />
                View Log Explorer
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Search, filter, and analyze your application logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Open Explorer
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
