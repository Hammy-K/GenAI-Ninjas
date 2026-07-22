import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Loader2, Search, LayoutGrid, Award } from "lucide-react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface Submission {
  id: number;
  user_name: string;
  project_name: string;
  url: string;
  school_name: string;
  facilitator_name: string;
  gender: string;
  grade: string;
  votes: {
    heart: number;
    funny: number;
  };
}

interface LeaderboardEntry {
  school_name: string;
  facilitator_name: string;
  count: number;
  rank: number;
}

interface ProjectSubmissionsGalleryProps {
  missionId?: string;
}

export default function ProjectSubmissionsGallery({
  missionId,
}: ProjectSubmissionsGalleryProps) {
  const [viewMode, setViewMode] = useState<"gallery" | "leaderboard">(
    "gallery",
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, Set<string>>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  // Check Firebase auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [missionId]);

  // Filter submissions based on search and gender
  useEffect(() => {
    let filtered = submissions;

    // Apply gender filter
    if (genderFilter !== "all") {
      filtered = filtered.filter((sub) => sub.gender === genderFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((sub) => {
        return (
          sub.user_name?.toLowerCase().includes(query) ||
          sub.facilitator_name?.toLowerCase().includes(query) ||
          sub.school_name?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredSubmissions(filtered);
  }, [searchQuery, genderFilter, submissions]);

  // Calculate leaderboard data
  const leaderboardData = useMemo(() => {
    const aggregated = new Map<string, LeaderboardEntry>();

    // For leaderboard, we want to show facilitators who have ANY students of the filtered gender
    // So we filter by gender, but count all submissions (not by search)
    let submissionsForLeaderboard = submissions;

    if (genderFilter !== "all") {
      submissionsForLeaderboard = submissions.filter(
        (sub) => sub.gender === genderFilter,
      );
    }

    submissionsForLeaderboard.forEach((sub) => {
      const key = `${sub.school_name}|${sub.facilitator_name}`;

      if (aggregated.has(key)) {
        const entry = aggregated.get(key)!;
        entry.count += 1;
      } else {
        aggregated.set(key, {
          school_name: sub.school_name || "غير محدد",
          facilitator_name: sub.facilitator_name || "غير محدد",
          count: 1,
          rank: 0,
        });
      }
    });

    // Convert to array and sort by count descending
    const sorted = Array.from(aggregated.values()).sort(
      (a, b) => b.count - a.count,
    );

    // Assign ranks
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return sorted;
  }, [submissions, genderFilter]);

  const fetchSubmissions = async () => {
    try {
      const url = missionId
        ? `/api/project-submissions/gallery?mission_id=${missionId}`
        : "/api/project-submissions/gallery";

      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setSubmissions(data.submissions);
        setFilteredSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign-in error:", error);
      alert("فشل تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleVote = async (
    submissionId: number,
    voteType: "heart" | "funny",
  ) => {
    if (!userEmail) {
      handleSignIn();
      return;
    }

    try {
      const response = await fetch(
        `/api/project-submissions/${submissionId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userEmail,
            vote_type: voteType,
          }),
        },
      );

      const data = await response.json();

      if (data.ok) {
        // Update local state
        setSubmissions((prev) =>
          prev.map((sub) => {
            if (sub.id === submissionId) {
              const delta = data.action === "added" ? 1 : -1;
              return {
                ...sub,
                votes: {
                  ...sub.votes,
                  [voteType]: Math.max(0, sub.votes[voteType] + delta),
                },
              };
            }
            return sub;
          }),
        );

        // Update userVotes tracking
        setUserVotes((prev) => {
          const newVotes = { ...prev };
          if (!newVotes[submissionId]) {
            newVotes[submissionId] = new Set();
          }

          if (data.action === "added") {
            newVotes[submissionId].add(voteType);
          } else {
            newVotes[submissionId].delete(voteType);
          }

          return newVotes;
        });
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const hasUserVoted = (submissionId: number, voteType: string) => {
    return userVotes[submissionId]?.has(voteType) || false;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-4xl font-bold mb-8 text-center">معرض المشاريع</h1>

      {!userEmail && viewMode === "gallery" && (
        <Card className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="pt-6">
            <p className="text-center mb-4 text-lg">
              سجل دخولك للتصويت على المشاريع!
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleSignIn}
                disabled={signingIn}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {signingIn ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التحميل...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>تسجيل الدخول بحساب Google</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {userEmail && (
        <div className="mb-4 text-center text-sm text-muted">
          مرحباً {userEmail}
        </div>
      )}

      {/* View Toggle - Prominent */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border-2 border-purple-600 p-1 bg-white shadow-lg">
          <Button
            variant={viewMode === "gallery" ? "default" : "ghost"}
            size="lg"
            onClick={() => setViewMode("gallery")}
            className={`gap-2 ${
              viewMode === "gallery"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                : "text-foreground hover:text-primary"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="font-bold">معرض المشاريع</span>
          </Button>
          <Button
            variant={viewMode === "leaderboard" ? "default" : "ghost"}
            size="lg"
            onClick={() => setViewMode("leaderboard")}
            className={`gap-2 ${
              viewMode === "leaderboard"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                : "text-foreground hover:text-primary"
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="font-bold">لوحة المتصدرين</span>
          </Button>
        </div>
      </div>

      {/* Gender Filter - Show in both views */}
      <div className="mb-6 flex justify-center gap-2">
        <Button
          variant={genderFilter === "all" ? "default" : "outline"}
          onClick={() => setGenderFilter("all")}
          className={
            genderFilter === "all" ? "bg-primary hover:bg-primary" : ""
          }
        >
          الكل
        </Button>
        <Button
          variant={genderFilter === "male" ? "default" : "outline"}
          onClick={() => setGenderFilter("male")}
          className={
            genderFilter === "male" ? "bg-primary hover:bg-primary" : ""
          }
        >
          طلاب
        </Button>
        <Button
          variant={genderFilter === "female" ? "default" : "outline"}
          onClick={() => setGenderFilter("female")}
          className={
            genderFilter === "female" ? "bg-primary hover:bg-primary" : ""
          }
        >
          طالبات
        </Button>
      </div>

      {/* Search Filter - Only show in gallery view */}
      {viewMode === "gallery" && (
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث بالطالب أو الميسّر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      )}

      {/* Leaderboard View */}
      {viewMode === "leaderboard" && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h2 className="text-2xl font-bold text-center">
                🏆 لوحة المتصدرين - المدارس والميسّرين
              </h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b-2 border-border">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                        الترتيب
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                        المدرسة
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                        الميسّر
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                        عدد المشاريع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboardData.map((entry) => {
                      const rankIcon = getRankIcon(entry.rank);
                      const isTopThree = entry.rank <= 3;

                      return (
                        <tr
                          key={`${entry.school_name}-${entry.facilitator_name}`}
                          className={`hover:bg-card transition-colors ${
                            isTopThree
                              ? "bg-gradient-to-l from-yellow-50 to-transparent"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {rankIcon && (
                                <span className="text-2xl">{rankIcon}</span>
                              )}
                              <span
                                className={`font-bold ${
                                  isTopThree ? "text-lg" : "text-base"
                                }`}
                              >
                                {entry.rank}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              isTopThree ? "font-bold text-lg" : "text-base"
                            }`}
                          >
                            {entry.school_name}
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              isTopThree ? "font-bold text-lg" : "text-base"
                            }`}
                          >
                            {entry.facilitator_name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                                isTopThree
                                  ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xl"
                                  : "bg-gray-100 text-foreground text-lg"
                              }`}
                            >
                              {entry.count}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {leaderboardData.length === 0 && (
            <div className="text-center text-muted mt-12">
              <p className="text-xl">لا توجد بيانات لعرضها</p>
            </div>
          )}
        </div>
      )}

      {/* Gallery View */}
      {viewMode === "gallery" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <Card
                key={submission.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.open(submission.url, "_blank")}
              >
                <CardHeader className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 relative">
                    <iframe
                      src={submission.url}
                      className="w-full h-full pointer-events-none"
                      title={submission.project_name}
                      sandbox="allow-scripts allow-same-origin"
                    />
                    <div className="absolute inset-0 bg-transparent" />
                  </div>
                </CardHeader>

                <CardContent
                  className="pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-bold text-lg mb-2">
                    {submission.project_name}
                  </h3>
                  <div className="space-y-1 text-sm text-muted">
                    <p>
                      <strong>الطالب:</strong> {submission.user_name}
                    </p>
                    {submission.school_name && (
                      <p>
                        <strong>المدرسة:</strong> {submission.school_name}
                      </p>
                    )}
                    {submission.facilitator_name && (
                      <p>
                        <strong>الميسّر:</strong> {submission.facilitator_name}
                      </p>
                    )}
                    {submission.grade && (
                      <p>
                        <strong>الصف:</strong> {submission.grade}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter
                  className="flex gap-4 justify-center border-t pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant={
                      hasUserVoted(submission.id, "heart")
                        ? "default"
                        : "outline"
                    }
                    size="lg"
                    onClick={() => handleVote(submission.id, "heart")}
                    className="gap-2 text-xl"
                  >
                    <span
                      className={
                        hasUserVoted(submission.id, "heart") ? "scale-110" : ""
                      }
                    >
                      ❤️
                    </span>
                    <span className="text-sm">{submission.votes.heart}</span>
                  </Button>

                  <Button
                    variant={
                      hasUserVoted(submission.id, "funny")
                        ? "default"
                        : "outline"
                    }
                    size="lg"
                    onClick={() => handleVote(submission.id, "funny")}
                    className="gap-2 text-xl"
                  >
                    <span
                      className={
                        hasUserVoted(submission.id, "funny") ? "scale-110" : ""
                      }
                    >
                      😂
                    </span>
                    <span className="text-sm">{submission.votes.funny}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredSubmissions.length === 0 && !loading && (
            <div className="text-center text-muted mt-12">
              <p className="text-xl">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد مشاريع بعد"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
