'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AdminOverviewProps {
  institutionId: string
  catalogId: string
}

interface ChartData {
  date: string
  orders: number
}

interface OverviewStats {
  total_orders: number
  total_items: number
  total_users: number
  overdue_orders: number
  chart_data: ChartData[]
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

interface UserStats {
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    delays: number
  }
  statistics: {
    total_orders: number
    ongoing_orders: number
    returned_orders: number
  }
}

interface Item {
  id: string
  name: string
  description: string | null
  default_quantity: number
  actual_quantity: number
}

interface ItemStats {
  item: {
    id: string
    name: string
    description: string | null
    default_quantity: number
    actual_quantity: number
  }
  statistics: {
    total_stock: number
    available_stock: number
    borrowed_stock: number
  }
}

export default function AdminOverview({ institutionId, catalogId }: AdminOverviewProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = React.useState("30d")
  
  // User selection state
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userStatsLoading, setUserStatsLoading] = useState(false)

  // Item selection state
  const [items, setItems] = useState<Item[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [itemStats, setItemStats] = useState<ItemStats | null>(null)
  const [itemStatsLoading, setItemStatsLoading] = useState(false)

  useEffect(() => {
    if (!institutionId || !catalogId) return

    const fetchStats = async () => {
      try {
        const res = await fetch(
          `/api/admin/overview?institution=${institutionId}&catalog=${catalogId}`
        )

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`)
        }

        const data = await res.json()
        setStats(data)
        } catch (err) {
        console.error(err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unexpected error occurred.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [institutionId, catalogId])

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/user/all')
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`)
        }
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }

    fetchUsers()
  }, [])

  // Fetch all items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/admin/items/all?catalog=${catalogId}`)
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`)
        }
        const data = await res.json()
        setItems(data)
      } catch (err) {
        console.error('Error fetching items:', err)
      }
    }

    if (catalogId) {
      fetchItems()
    }
  }, [catalogId])

  // Fetch user stats when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setUserStats(null)
      return
    }

    const fetchUserStats = async () => {
      setUserStatsLoading(true)
      try {
        const res = await fetch(`/api/admin/user/stat?user=${selectedUserId}`)
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`)
        }
        const data = await res.json()
        setUserStats(data)
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setUserStats(null)
      } finally {
        setUserStatsLoading(false)
      }
    }

    fetchUserStats()
  }, [selectedUserId])

  // Fetch item stats when item is selected
  useEffect(() => {
    if (!selectedItemId) {
      setItemStats(null)
      return
    }

    const fetchItemStats = async () => {
      setItemStatsLoading(true)
      try {
        const res = await fetch(`/api/admin/items/stat?item=${selectedItemId}`)
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`)
        }
        const data = await res.json()
        setItemStats(data)
      } catch (err) {
        console.error('Error fetching item stats:', err)
        setItemStats(null)
      } finally {
        setItemStatsLoading(false)
      }
    }

    fetchItemStats()
  }, [selectedItemId])

  if (loading) return <p>Loading overview...</p>
  if (error) return <p>Error: {error}</p>
  if (!stats) return <p>No data available</p>

  const filteredData = stats.chart_data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date(stats.chart_data[stats.chart_data.length - 1]?.date || new Date())
    let daysToSubtract = 30
    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "14d") {
      daysToSubtract = 14
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  // Prepare radar chart data
  const userRadarChartData = userStats ? [
    { metric: "Total Orders", value: userStats.statistics.total_orders },
    { metric: "Ongoing Orders", value: userStats.statistics.ongoing_orders },
    { metric: "Returned Orders", value: userStats.statistics.returned_orders },
    { metric: "Delays", value: userStats.user.delays },
  ] : []

  const itemRadarChartData = itemStats ? [
    { metric: "Total Stock", value: itemStats.statistics.total_stock },
    { metric: "Available Stock", value: itemStats.statistics.available_stock },
    { metric: "Borrowed Stock", value: itemStats.statistics.borrowed_stock },
  ] : []

  const userChartConfig = {
    value: {
      label: "User Statistics",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const itemChartConfig = {
    value: {
      label: "Item Statistics",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`Date: ${new Date(label || '').toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`}</p>
          <p className="text-blue-600">{`Orders created: ${payload[0]?.value || 0}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gap-1">
          <CardHeader>
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats.total_orders} orders
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start text-sm">
            <div className="text-muted-foreground">
              All orders in this catalog including completed and ongoing
            </div>
          </CardFooter>
        </Card>

        <Card className="gap-1">
          <CardHeader>
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats.total_items} items
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start text-sm">
            <div className="text-muted-foreground">
              Total items in the catalog inventory
            </div>
          </CardFooter>
        </Card>

        <Card className="gap-1">
          <CardHeader>
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats.total_users} students
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start text-sm">
            <div className="text-muted-foreground">
              Total students
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Statistics Radar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics Radar Chart */}
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>
              Select a user to view their order statistics
            </CardDescription>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email} {user.first_name && user.last_name ? `(${user.first_name} ${user.last_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pb-0">
            {userStatsLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <p>Loading user statistics...</p>
              </div>
            ) : userStats ? (
              <ChartContainer
                config={userChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <RadarChart data={userRadarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                  />
                  <PolarGrid />
                  <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Select a user to view statistics</p>
              </div>
            )}
          </CardContent>
          {userStats && (
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                {userStats.user.email
                } 
              </div>
              
            </CardFooter>
          )}
        </Card>

        {/* Item Statistics Radar Chart */}
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle>Item Statistics</CardTitle>
            <CardDescription>
              Select an item to view its stock statistics
            </CardDescription>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pb-0">
            {itemStatsLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <p>Loading item statistics...</p>
              </div>
            ) : itemStats ? (
              <ChartContainer
                config={itemChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <RadarChart data={itemRadarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                  />
                  <PolarGrid />
                  <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Select an item to view statistics</p>
              </div>
            )}
          </CardContent>
          {itemStats && (
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                {itemStats.item.name}
              </div>
              
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Chart */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Orders Created Per Day</CardTitle>
            
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <YAxis 
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  fill="url(#fillOrders)"
                  name="Orders created"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Orders created</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
