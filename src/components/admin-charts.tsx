"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DayCount {
  date: string;
  count: number;
}

interface SportCount {
  name: string;
  value: number;
}

interface AdminChartsProps {
  newUsersPerDay: DayCount[];
  teamsBySport: SportCount[];
  locale: string;
}

const PIE_COLORS = [
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

const FALLBACK_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];

export function AdminCharts({ newUsersPerDay, teamsBySport, locale }: AdminChartsProps) {
  const colors = FALLBACK_COLORS;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Area chart — new users per day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "cs" ? "Noví uživatelé (posledních 30 dní)" : "New Users (last 30 days)"}
          </CardTitle>
          <CardDescription>
            {locale === "cs" ? "Denní počet registrací" : "Daily registrations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={newUsersPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(v) => (locale === "cs" ? `Datum: ${v}` : `Date: ${v}`)}
                formatter={(v) => [v, locale === "cs" ? "Registrace" : "Registrations"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart — teams by sport */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "cs" ? "Týmy podle sportu" : "Teams by Sport"}
          </CardTitle>
          <CardDescription>
            {locale === "cs" ? "Rozložení týmů" : "Team distribution"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamsBySport.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              {locale === "cs" ? "Žádná data" : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={teamsBySport}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {teamsBySport.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v, name) => [v, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
