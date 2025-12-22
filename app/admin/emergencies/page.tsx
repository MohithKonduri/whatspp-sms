"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { AlertCircle, Droplet, Phone, Search, Filter, ArrowUpDown, Calendar } from "lucide-react"
import type { EmergencyRequest } from "@/lib/types"

export default function AdminEmergenciesPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("latest")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all")

  const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]

  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession")
    if (!adminSession) {
      router.push("/admin/login")
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRequests()
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchRequests = async () => {
    try {
      const requestsSnapshot = await getDocs(collection(db, "emergencyRequests"))
      const requestsList = requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as EmergencyRequest)
      setRequests(requestsList)
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRequestDate = (req: any) => {
    const date = req.createdAt || req.timestamp;
    if (!date) return new Date(0);
    if (typeof date.toDate === "function") return date.toDate();
    return new Date(date);
  };

  const filteredAndSortedRequests = requests
    .filter((req) => bloodGroupFilter === "all" || req.bloodGroup === bloodGroupFilter)
    .sort((a, b) => {
      const dateA = getRequestDate(a).getTime();
      const dateB = getRequestDate(b).getTime();
      if (sortBy === "latest") {
        return dateB - dateA;
      } else if (sortBy === "oldest") {
        return dateA - dateB;
      } else if (sortBy === "bloodGroup") {
        return a.bloodGroup.localeCompare(b.bloodGroup)
      }
      return 0
    })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-background px-6 py-4">
          <h1 className="text-2xl font-bold">Emergency Requests</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Filter className="h-4 w-4" /> Filter by Blood Group
                    </label>
                    <select
                      value={bloodGroupFilter}
                      onChange={(e) => setBloodGroupFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    >
                      <option value="all">All Blood Groups</option>
                      {BLOOD_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <ArrowUpDown className="h-4 w-4" /> Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="bloodGroup">Blood Group (A-Z)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredAndSortedRequests.length > 0 ? (
                filteredAndSortedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Droplet className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold">{request.bloodGroup}</span>
                          </div>
                          <p className="text-muted-foreground">{request.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Requested on: {getRequestDate(request).toLocaleString()}</span>
                          </div>
                          <div
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor(request.urgency)}`}
                          >
                            {request.urgency.toUpperCase()}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Contact Name</p>
                            <p className="font-semibold">{request.contactName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="font-semibold">{request.contactPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">District</p>
                            <p className="font-semibold">{request.district}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-semibold capitalize">{request.status}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No emergency requests found matching your filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
