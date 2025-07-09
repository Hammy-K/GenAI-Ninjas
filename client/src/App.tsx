import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Mission1 from "@/pages/mission1";
import GameMission from "@/pages/game-mission";
import Project from "@/pages/project";
import Gallery from "@/pages/gallery";
import AppBuilderStream from "@/pages/app-builder";
import EmptyMission from "@/pages/missions/empty";
import GameDevMission from "@/pages/missions/game-dev";
import HTMLGeneratorV2 from "@/pages/missions/html-generator-v2";
import HtmlGeneratorV2SubmissionsPage from "@/pages/missions/html-generator-v2/submissions";
import LovableMission from "@/pages/lovable-mission";
import IntroMission from "@/pages/intro-mission";
import LovableSubmissionsPage from "@/pages/lovable-submissions";
import ResetInstructions from "@/pages/reset-instructions";
import { ResetSession } from "@/components/ResetSession";
import ResetIntro from "@/components/ResetIntro";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { AuthProvider } from "./contexts/AuthContext";
import HtmlProjectsList from "./components/HTMLProjectsList";
import { HTMLStandalone } from "./components/stages/HTMLStandalone";
import AiHtmlGenerator from "./components/AiHtmlGenerator/AiHtmlGenerator";
import HTMLProjectsPage from "./components/HTMLProjectsList/HTMLProjectsPage";
import VideoPage from "./components/VideoGallery/VideoPage";
import VideoPlayer from "./components/VideoGallery/VideoPlayer";
import GalleryManagerPage from "./pages/admin/GalleryManagerPage";

// Wrapper components for HTML Generator routes
function HTMLGeneratorWrapper() {
  return (
    <div
      className="min-h-screen flex flex-col text-foreground font-tajawal"
      dir="rtl"
    >
      <main className="flex-1">
        <HTMLStandalone
          onComplete={() => {}}
          onEarnXp={() => {}}
          onUnlockBadge={() => {}}
          onBack={() => {}}
        />
      </main>
    </div>
  );
}

function Router() {
  // Set the HTML dir and lang attributes for RTL support
  useEffect(() => {
    document.documentElement.dir = "rtl"; // Set to RTL for right-to-left layout
    document.documentElement.lang = "ar"; // Use Arabic as the default language for RTL
  }, []);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/mission1" component={Mission1} />
      <Route path="/mission1/stage/:stageName" component={Mission1} />
      <Route path="/game/mission:id" component={GameMission} />
      <Route path="/project/:projectId" component={Project} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/app-builder" component={AppBuilderStream} />
      <Route path="/missions/empty" component={EmptyMission} />
      <Route path="/missions/game-dev" component={GameDevMission} />
      <Route path="/missions/lovable" component={LovableMission} />
      <Route path="/intro-mission" component={IntroMission} />
      <Route
        path="/missions/lovable/submissions"
        component={LovableSubmissionsPage}
      />
      <Route path="/missions/videos" component={VideoPage} />
      <Route path="/missions/videos/:videoId" component={VideoPlayer} />

      {/* <Route
        path="/missions/html-projects/submissions"
        component={HtmlProjectsList}
      /> */}
      <Route path="/reset-instructions" component={ResetInstructions} />
      {/* Standalone HTML Generator */}
      <Route path="/missions/html-generator" component={HTMLGeneratorWrapper} />
      <Route
        path="/missions/html-generator/submissions"
        component={HTMLProjectsPage}
      />
      <Route path="/missions/ai-html-generator" component={AiHtmlGenerator} />
      {/* Standalone HTML Generator */}

      <Route path="/missions/html-generator-v2" component={HTMLGeneratorV2} />
      {/* <Route path="/missions/html-generator-v2/submissions" component={HtmlGeneratorV2SubmissionsPage} /> */}

      <Route path="/reset" component={ResetSession} />
      <Route path="/reset-intro" component={ResetIntro} />
      {/* <Route path="/admin/gallery" component={GalleryManagerPage} /> */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        {/* Debug panel removed as requested */}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
