
"use client"

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts"

interface CategoryPieChartProps {
    data: { name: string; value: number, fill: string }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <Legend iconSize={10} />
            </PieChart>
        </ResponsiveContainer>
    );
}
