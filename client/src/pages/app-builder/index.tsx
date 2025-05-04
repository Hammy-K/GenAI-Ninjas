import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; 
import { queryClient } from "@/lib/queryClient";
import { useQuest } from "@/hooks/useQuest";

// Helper function for API requests
async function makeApiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * AppBuilderStream
 * 
 * Main page for the App Builder Stream.
 * Implements the 11-step sequential journey with Dr. Pengy chat support.
 */
export default function AppBuilderStream() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressId, setProgressId] = useState<number | null>(null);
  const [drPengyChat, setDrPengyChat] = useState<string[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const TOTAL_STEPS = 11; // Total steps in the App Builder Stream
  
  // Fetch user's progress when the component mounts
  useEffect(() => {
    if (user?.uid) {
      startOrResumeJourney(user.uid);
    }
  }, [user?.uid]);
  
  // Start or resume the App Builder journey
  const startOrResumeJourney = async (firebaseUid: string) => {
    try {
      setLoading(true);
      
      // Start or resume the journey
      const response = await makeApiRequest('/api/app-builder/start', {
        method: 'POST',
        body: JSON.stringify({ firebaseUid })
      });
      
      if (response.success && response.progress) {
        setCurrentStep(response.progress.currentStep);
        setProgressId(response.progress.id);
        toast({
          title: "مسار بناء التطبيق",
          description: response.progress.currentStep > 1 
            ? "تم استئناف رحلتك في بناء التطبيق" 
            : "مرحبًا بك في مسار بناء التطبيق!"
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في بدء مسار بناء التطبيق. حاول مرة أخرى لاحقًا.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error starting App Builder journey:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة بدء مسار بناء التطبيق",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending a message to Dr. Pengy
  const handleSendMessage = async () => {
    if (!userMessage.trim() || !progressId || !user?.uid) return;
    
    try {
      setSubmitting(true);
      setDrPengyChat(prev => [...prev, `أنت: ${userMessage}`]);
      
      const response = await makeApiRequest('/api/app-builder/chat-with-dr-pengy', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: user.uid,
          progressId,
          stepNumber: currentStep,
          message: userMessage
        })
      });
      
      if (response.success && response.message) {
        setDrPengyChat(prev => [...prev, `د. بنجي: ${response.message.content}`]);
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إرسال الرسالة إلى د. بنجي",
          variant: "destructive"
        });
      }
      
      setUserMessage("");
    } catch (error) {
      console.error("Error sending message to Dr. Pengy:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle going back to dashboard
  const handleBackToDashboard = () => {
    navigate("/");
  };
  
  // UI placeholder for the steps until we implement them
  const renderStepContent = () => {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-purple-700 mb-4">
          الخطوة {currentStep} من {TOTAL_STEPS}
        </h2>
        <p className="text-gray-700 mb-6">
          هذه الخطوة سيتم تنفيذها قريبًا. الآن يمكنك استخدام الدردشة مع د. بنجي للحصول على المساعدة.
        </p>
        <div className="flex justify-start mt-4">
          <Button 
            onClick={() => setCurrentStep(currentStep < TOTAL_STEPS ? currentStep + 1 : 1)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {currentStep < TOTAL_STEPS ? "الخطوة التالية" : "البداية من جديد"}
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-700 font-tajawal">
      <Header xp={0} />
      
      {/* Back to Dashboard Button */}
      <div className="bg-white border-b py-2">
        <div className="max-w-6xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToDashboard}
            className="flex items-center text-sm"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة إلى لوحة المهام
          </Button>
        </div>
      </div>
      
      <ProgressBar currentStage={currentStep} totalStages={TOTAL_STEPS} />
      
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Dr. Pengy Chat - 30% width */}
            <div className="w-full md:w-[30%] order-2 md:order-1">
              <Card className="h-full">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-3 text-right">الدردشة مع د. بنجي</h3>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-3 h-72 overflow-y-auto flex flex-col space-y-2 text-right">
                    {drPengyChat.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        مرحبًا بك في مسار بناء التطبيق! أنا د. بنجي، وسأكون معك في كل خطوة. هل لديك أي سؤال؟
                      </p>
                    ) : (
                      drPengyChat.map((message, idx) => (
                        <div 
                          key={idx} 
                          className={`p-2 rounded-lg max-w-[85%] ${
                            message.startsWith("أنت:") 
                              ? "bg-purple-100 self-end" 
                              : "bg-blue-100 self-start"
                          }`}
                        >
                          <p className="text-sm">{message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="flex-grow p-2 border rounded-r-lg text-right"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={submitting || !userMessage.trim()}
                      className="rounded-l-lg rounded-r-none"
                    >
                      إرسال
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Step Content - 70% width */}
            <div className="w-full md:w-[70%] order-1 md:order-2">
              {loading ? (
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                  <p>جاري تحميل المحتوى...</p>
                </div>
              ) : (
                renderStepContent()
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}