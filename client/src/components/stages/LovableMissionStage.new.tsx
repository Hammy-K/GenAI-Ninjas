// Using existing imports at the top of the file
import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { trackStageProgress } from "@/lib/analytics";
import drPengyAvatar from "@assets/Pengy_chat.png";
import CelebrationAnimation from "@/components/animations/CelebrationAnimation";
import StudentInfoModal from "@/components/modals/StudentInfoModal";

// Keep the existing ChatMessage interface, welcomeMessage, and other constants the same

// This is a starter skeleton - actual implementation would copy over previous functionality
export default function LovableMissionStage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use smooth scrolling for better user experience
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, [state.messages]);
  
  // Also scroll when loading state changes (for loading indicators)
  useEffect(() => {
    if (messagesEndRef.current && state.isLoading) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end" 
      });
    }
  }, [state.isLoading]);

  // Would duplicate rest of state and functions here... for the demo just showing structure

  return (
    <div className="flex flex-col h-full p-4">
      {/* Student Info Modal */}
      {!state.isStudentInfoCompleted && (
        <StudentInfoModal onComplete={handleStudentInfoComplete} />
      )}

      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={state.showCelebration}
        onComplete={handleCelebrationComplete}
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Chat Panel - 75% width */}
        <div className="w-[75%] flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden max-h-full">
          {/* Messages Container - fixed scrolling */}
          <div className="flex-1 overflow-y-auto p-4 h-0 min-h-0">
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border"
                    } ${message.className || ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2 gap-2">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden">
                          <img
                            src={drPengyAvatar}
                            alt="Dr. Pengy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-sm">
                          الدكتور بنجي
                        </span>
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}

              {/* Empty div for scroll reference */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 border-t flex-shrink-0">
            <form className="flex gap-2">
              <Textarea
                className="flex-1 resize-none"
                rows={1}
                placeholder="اكتب رسالتك هنا..."
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Checklist Panel - 25% width */}
        <div className="w-[25%] flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden max-h-full">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold text-center">قائمة المهام</h3>
          </div>
          
          {/* Scrollable checklist */}
          <div className="flex-1 overflow-y-auto p-4 h-0 min-h-0">
            <div className="space-y-3">
              {/* Checklist items would go here */}
            </div>
          </div>
          
          {/* Project submission - fixed at bottom */}
          <div className="p-4 border-t flex-shrink-0">
            <form>
              <Label className="text-sm font-bold">
                رابط المشروع
              </Label>
              <Input
                placeholder="https://...lovable.app"
                className="text-sm bg-white-50 mt-1"
              />
              <Button
                type="submit"
                className="mt-4 bg-green-600 hover:bg-green-700 text-white w-full"
              >
                تقديم المشروع
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
