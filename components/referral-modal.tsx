"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, CheckCircle } from "lucide-react"

interface ReferralModalProps {
    isOpen: boolean
    onClose: () => void
    referredByUserId: string
    referredByName: string
}

export function ReferralModal({ isOpen, onClose, referredByUserId, referredByName }: ReferralModalProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        age: "",
        gender: "",
        bloodGroup: "",
        mobileNumber: "",
        email: "",
        area: "",
        willingToDonate: false,
        consent: false,
    })

    if (!isOpen) return null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.willingToDonate || !formData.consent) {
                alert("Please ensure all consent boxes are checked.")
                setLoading(false)
                return
            }

            await addDoc(collection(db, "referrals"), {
                fullName: formData.fullName,
                age: Number(formData.age),
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                mobileNumber: formData.mobileNumber,
                email: formData.email,
                area: formData.area,
                willingToDonate: formData.willingToDonate,
                consent: formData.consent,
                referredByUserId,
                referredByName,
                verificationStatus: "pending",
                createdAt: serverTimestamp(),
            })

            setSuccess(true)
            setTimeout(() => {
                onClose()
                setSuccess(false)
                setFormData({
                    fullName: "",
                    age: "",
                    gender: "",
                    bloodGroup: "",
                    mobileNumber: "",
                    email: "",
                    area: "",
                    willingToDonate: false,
                    consent: false,
                })
            }, 2000)
        } catch (error) {
            console.error("Error submitting referral:", error)
            alert("Failed to submit referral. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                <CardHeader>
                    <CardTitle>Refer a Potential Donor</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Help us grow our community by referring someone willing to donate.
                    </p>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <h3 className="text-xl font-semibold">Referral Submitted!</h3>
                            <p className="text-muted-foreground">Thank you for helping save lives.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Full Name *
                                </label>
                                <Input
                                    required
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Age *</label>
                                    <Input
                                        required
                                        type="number"
                                        name="age"
                                        min="18"
                                        max="65"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="18+"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Gender *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Blood Group *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="bloodGroup"
                                            value={formData.bloodGroup}
                                            onChange={handleChange}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        >
                                            <option value="">Select Group</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Mobile Number *</label>
                                    <Input
                                        required
                                        type="tel"
                                        name="mobileNumber"
                                        pattern="[0-9]{10}"
                                        title="10 digit mobile number"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        placeholder="1234567890"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Email (Optional)</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Area / District *</label>
                                <Input
                                    required
                                    name="area"
                                    value={formData.area}
                                    onChange={handleChange}
                                    placeholder="e.g. Hyderabad"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id="willingToDonate"
                                        name="willingToDonate"
                                        checked={formData.willingToDonate}
                                        onChange={handleCheckboxChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                                    />
                                    <label
                                        htmlFor="willingToDonate"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        The referred person is willing to donate blood voluntarily.
                                    </label>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id="consent"
                                        name="consent"
                                        checked={formData.consent}
                                        onChange={handleCheckboxChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                                    />
                                    <label
                                        htmlFor="consent"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        I confirm that the referred person has agreed to be contacted for blood donation.
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Referral"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
