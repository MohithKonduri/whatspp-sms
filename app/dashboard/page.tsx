"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore"
import type { User } from "firebase/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, Heart, AlertCircle, Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import type { Donor } from "@/lib/types"
import { EmergencyContact } from "@/components/emergency-contact"

import { ReferralModal } from "@/components/referral-modal"
import { addDays, isBefore, parseISO, format } from "date-fns"

interface Referral {
  id: string
  fullName: string
  verificationStatus: "pending" | "verified" | "rejected"
  referredByUserId: string
  createdAt: any
}

export default function DashboardPage() {
  const [donor, setDonor] = useState<Donor | null>(null)
  const [loading, setLoading] = useState(true)
  const [userReferrals, setUserReferrals] = useState<Referral[]>([])
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const router = useRouter()

  // Calculate eligibility
  const today = new Date()
  let isCooldown = false
  let nextEligibleDate: Date | null = null

  if (donor?.lastDonationDate) {
    // Handle both Firestore Timestamp (has .toDate()) and string/number formats
    let lastDonation: Date;
    const rawDate: any = donor.lastDonationDate;

    if (rawDate && typeof rawDate.toDate === 'function') {
      lastDonation = rawDate.toDate();
    } else {
      lastDonation = new Date(rawDate);
    }

    if (!isNaN(lastDonation.getTime())) {
      const eligibilityDate = addDays(lastDonation, 90)
      if (isBefore(today, eligibilityDate)) {
        isCooldown = true
        nextEligibleDate = eligibilityDate
      }
    }
  }

  useEffect(() => {
    let referralsUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          // Listen for referrals updates
          const referralsQuery = query(
            collection(db, "referrals"),
            where("referredByUserId", "==", user.uid)
          );

          referralsUnsubscribe = onSnapshot(referralsQuery, (snapshot) => {
            const referralsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Referral[];
            setUserReferrals(referralsData);
          }, (error) => {
            console.error("Referrals snapshot error:", error);
          });

          // Prefer fetching by UID (new write strategy)
          const donorDocRef = doc(db, "donors", user.uid)
          const donorDocSnap = await getDoc(donorDocRef)
          if (donorDocSnap.exists()) {
            const donorData = { id: donorDocSnap.id, ...donorDocSnap.data() } as Donor
            setDonor(donorData)
            setLoading(false)
            return
          }

          // Fallback: query by email for legacy records
          console.log("Looking for donor with email:", user.email)
          const q = query(collection(db, "donors"), where("email", "==", user.email))
          const querySnapshot = await getDocs(q)
          console.log("Query result:", querySnapshot.docs.length, "documents found")
          if (!querySnapshot.empty) {
            const donorDoc = querySnapshot.docs[0]
            const donorData = { id: donorDoc.id, ...donorDoc.data() } as Donor
            console.log("Found donor data:", donorData)
            setDonor(donorData)
          } else {
            console.log("No donor found with email:", user.email)
            // No donor record → redirect to register without signing out
            router.push("/register")
          }
        } catch (error) {
          console.error("Error fetching donor:", error)
          // On error, just redirect to register or show error, don't sign out
          router.push("/register")
        }
      } else {
        // Only redirect to login if we explicitly have no user
        router.push("/login")
      }
      setLoading(false)
    })

    return () => {
      authUnsubscribe();
      if (referralsUnsubscribe) referralsUnsubscribe();
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Eligibility Warning & Referral Trigger */}
            {isCooldown && nextEligibleDate && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
                        Temporary Donation Cooldown
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-500">
                        You are not eligible to donate blood until <strong>{format(nextEligibleDate, "MMMM d, yyyy")}</strong>.
                        However, you can still help by referring someone else!
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsReferralModalOpen(true)}
                    className="shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Refer a Donor
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Welcome Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Welcome Back!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Thank you for being a blood donor. Your contribution saves lives in our community.
                </p>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Blood Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Droplet className="h-6 w-6 text-primary" />
                    <span className="text-2xl font-bold">{donor?.bloodGroup}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">District</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{donor?.district}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Roll Number</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{donor?.rollNumber}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Last Donation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {donor?.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isCooldown ? "bg-yellow-500" : (donor?.isAvailable ? "bg-green-500" : "bg-gray-400")}`} />
                      <span className="font-semibold">
                        {isCooldown ? "Cooldown Period" : (donor?.isAvailable ? "Available to Donate" : "Unavailable")}
                      </span>
                    </div>
                    {!isCooldown && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        You are currently eligible to donate blood.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild className="w-full">
                  <Link href="/search">Find Donors</Link>
                </Button>
                <Button onClick={() => setIsReferralModalOpen(true)} variant="secondary" className="w-full">
                  Refer a Donor
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/profile">Edit Profile</Link>
                </Button>
                <Button asChild variant="destructive" className="w-full">
                  <Link href="/emergency">🚨 Emergency Contact</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <EmergencyContact />

            {/* Referral Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userReferrals.length > 0 ? (
                  <div className="space-y-4">
                    {userReferrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{referral.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {referral.createdAt && format(referral.createdAt.toDate(), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {referral.verificationStatus === "verified" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </span>
                          )}
                          {referral.verificationStatus === "rejected" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </span>
                          )}
                          {referral.verificationStatus === "pending" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">You haven't referred any donors yet.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsReferralModalOpen(true)}>
                      Make Your First Referral
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    How to Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Keep your profile updated with current availability</p>
                  <p>2. Respond quickly to emergency requests</p>
                  <p>3. Share your experience with others</p>
                  <p>4. Maintain good health for regular donations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Donation Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Minimum age: 18 years</p>
                  <p>• Minimum weight: 50 kg</p>
                  <p>• Wait 56 days between donations</p>
                  <p>• Eat well and stay hydrated</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {donor && (
        <ReferralModal
          isOpen={isReferralModalOpen}
          onClose={() => setIsReferralModalOpen(false)}
          referredByUserId={donor.id}
          referredByName={donor.name}
        />
      )}
    </div>
  )
}
