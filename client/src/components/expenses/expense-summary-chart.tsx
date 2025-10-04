
"use client"

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function ExpenseSummaryChart({ data }: { data: {name: string, total: number}[] }) {
    const chartConfig = {
        total: {
            label: "Total",
            color: "hsl(var(--primary))",
        },
    }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
