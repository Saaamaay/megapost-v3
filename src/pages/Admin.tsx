import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, TrendingUp, BarChart3, Loader2, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UserDetail {
  id: string;
  email: string;
  created_at: string;
  trial_ends: string;
  is_trial_active: boolean;
  has_subscription: boolean;
  subscription_tier: string | null;
  subscription_interval: string | null;
}

interface AdminStats {
  totalUsers: number;
  trialActive: number;
  trialExpired: number;
  paidUsers: number;
  conversionRate: string;
  totalPosts: number;
  postsByDay: Record<string, number>;
  users: UserDetail[];
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    async function fetchStats() {
      setLoading(true);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("admin-stats");
      if (fnError || (data && data.error)) {
        const msg = data?.error || (typeof fnError === "object" && "message" in (fnError as any) ? (fnError as any).message : String(fnError));
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("non-2xx")) {
          setError("You don't have admin access.");
        } else {
          setError(msg);
        }
      } else {
        setStats(data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Go home</button>
      </div>
    );
  }

  if (!stats) return null;

  const chartData = Object.entries(stats.postsByDay)
    .map(([date, count]) => ({ date: date.substring(5), posts: count }))
    .slice(-14);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground underline">
            ← Back to app
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Users</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown badges */}
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary" className="text-sm">🟢 Active Trial: {stats.trialActive}</Badge>
          <Badge variant="secondary" className="text-sm">🔴 Expired Trial: {stats.trialExpired}</Badge>
          <Badge variant="secondary" className="text-sm">💳 Paid: {stats.paidUsers}</Badge>
        </div>

        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Posts / Day</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posts Generated (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No post data yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Signed Up</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-xs">{u.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {u.has_subscription ? (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>
                            ) : u.is_trial_active ? (
                              <Badge variant="secondary">Trial</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {u.subscription_tier
                              ? `${u.subscription_tier}${u.subscription_interval === "year" ? " (Annual)" : ""}`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
