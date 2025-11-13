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
import PromptEngineering from "@/pages/prompt-engineering";
// import LovableSubmissionsPage  from "@/pages/lovable-submissions";
import ResetInstructions from "@/pages/reset-instructions";
import { ResetSession } from "@/components/ResetSession";
import ResetIntro from "@/components/ResetIntro";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { AuthProvider } from "./contexts/AuthContext";
import HtmlProjectsList from "./components/HTMLProjectsList";
import { HTMLStandalone } from "./components/stages/HTMLStandalone";
import AiHtmlGenerator from "./components/AiHtmlGenerator/AiHtmlGenerator";
import HTMLProjectsPage from "./components/HTMLProjectsList/HTMLProjectsPage";
import InnovationChallenge from "@/pages/InnovationChallenge";
import VideoPage from "./components/VideoGallery/VideoPage";
import VideoPlayer from "./components/VideoGallery/VideoPlayer";
import GalleryManagerPage from "./pages/admin/GalleryManagerPage";
import AppDevelopmentPage from "./components/ApplicationDevelopmentMission/AppDevelopmentPage";
import FrontendFoundation from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/FrontendFoundation";
import InputsOutputsPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/InputsOutputsPlayground";
import ButtonsEventsPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/ButtonsEventsPlayground";
import RandomSelectionPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/RandomSelectionPlayground";
import ConditionalLogicPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/ConditionalLogic";
import LayoutDesignPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/LayoutDesignPlayground";
import DynamicImagesPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/DynamicImagesPlayground";
import DynamicInteractionMedia from "./components/ApplicationDevelopmentMission/missions/dynamic-interaction/DynamicInteractionMedia";
import MultiInputsPlayground from "./components/ApplicationDevelopmentMission/missions/dynamic-interaction/MultiInputsPlayground";
import NavigationPlayground from "./components/ApplicationDevelopmentMission/missions/dynamic-interaction/NavigationPlayground";
import EmbeddedMediaPlayground from "./components/ApplicationDevelopmentMission/missions/dynamic-interaction/EmbeddedMediaPlayground";
import LocalStatePlayground from "./components/ApplicationDevelopmentMission/missions/dynamic-interaction/LocalStatePlayground";
import BackendAiIntegration from "./components/ApplicationDevelopmentMission/missions/backend-ai-integration/BackendAiIntegration";
import ExternalApisPlayground from "./components/ApplicationDevelopmentMission/missions/backend-ai-integration/ExternalApisPlayground";
import OpenAIPlayground from "./components/ApplicationDevelopmentMission/missions/backend-ai-integration/OpenaiPlayground";
import PersistencePlayground from "./components/ApplicationDevelopmentMission/missions/backend-ai-integration/PersistancePlayground";
import AuthPersonalizationPlayground from "./components/ApplicationDevelopmentMission/missions/backend-ai-integration/AuthPersonalizationPlayground";
import AdminApp from "./pages/admin/AdminApp";
import GenaiSchoolTrainingPage from "./pages/GenaiSchoolTrainingPage";
import FrontendSubmissionsPage from "./pages/missions/application-development/frontend/FrontendSubmissionsPage";
import FrontendProjectViewerPage from "./pages/missions/application-development/frontend/FrontendProjectViewerPage";
import ClientReset from "./components/ClientReset";
import VideosHomePage from "./video-gallery/pages/VideosHomePage";
import VideoPlayerPage from "./video-gallery/pages/VideoPlayerPage";
import AppBuilderActivity from "./pages/AppBuilderActivity";
import LovablesActivity from "./pages/LovablesActivity";
import LovableMissionPage from "./lovable-mission/LovableMissionPage";
import LovableSubmissionsPage from "./lovable-mission/submissions/LovableSubmissionsPage";
import VideoGeneratorChatMissionPage from "./video-generator/video-generator-chat/VideoGeneratorChatMissionPage";
import { ImageGenerationPage } from "./image-generation/components/ImageGenerationPage";
import SceneFlowPage from "./video-generator/scene-flow/SceneFlowPage";
import ChatPage from "./pages/ChatPage";
import VideoSubmissionsPage from "./pages/VideoSubmissionsPage";
import { LovableAuthProvider } from "./lovable-mission/auth/AuthProvider";
import SubmissionsDashboard from "./pages/SubmissionsDashboard";
import LovableMissionPageV2 from "./lovable-mission/v2/LovableMissionPageV2";
import YouTubeVideoPage from "./pages/VideoPage";
import MangaStoryPlanner from "./pages/MangaPlanner";
import { PengyRedemption } from "@/image-generation/components/PengyRedemption";
import ProjectSubmissionsGallery from "@/pages/ProjectSubmissionGallery";
import FinalProjectPlayground from "./components/ApplicationDevelopmentMission/missions/frontend-foundation/FinalProjectPlayground";
import ClipsMissionPage from "./pages/Clips/ClipsMissionPage";
import ClipsSubmissionsPage from "./pages/Clips/clips-submissions/ClipsSubmissionPage";
import OpenLinkPage from "./pages/OpenLinkPage";

// Ali's Additions
import AIPollControl from "./pages/AIPollControl";
import AIPollVote from "./pages/AIPollVote";
import MediaAssetsControl from "./pages/MediaAssetsControl";
import MediaAssetsGallery from "./pages/MediaAssetsGallery";
import VideoLibraryAdmin from "./pages/VideoLibraryAdmin";
import VideoLibrary from "./pages/VideoLibrary";
import TextLibraryAdmin from "./pages/TextLibraryAdmin";
import TextLibrary from "./pages/TextLibrary";
//--------------------------------------------------------------------------------

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
      {/* <Route path="/:prefix(ffm)?/" component={Dashboard} /> */}
      <Route path="/" component={Dashboard} />
      <Route path="/open-link" component={OpenLinkPage} />
      <Route path="/innovation-challenge" component={InnovationChallenge} />
      <Route path="/ffm/" component={Dashboard} />
      <Route path="/intro-mission" component={IntroMission} />
      <Route path="/prompt-engineering" component={PromptEngineering} />
      <Route path="/ffm/intro-mission" component={IntroMission} />
      <Route path="/missions/ai-html-generator" component={AiHtmlGenerator} />
      <Route path="/missions/manga-planner" component={MangaStoryPlanner} />
      <Route path="/pengy-redemption" component={PengyRedemption} />
      <Route
        path="/video-generator/video-generator-chat"
        component={VideoGeneratorChatMissionPage}
      />
      <Route
        path="/ffm/missions/ai-html-generator"
        component={AiHtmlGenerator}
      />
      <Route
        path="/missions/html-generator/submissions"
        component={HTMLProjectsPage}
      />
      <Route
        path="/ffm/missions/html-generator/submissions"
        component={HTMLProjectsPage}
      />
      <Route path="/missions/app-development" component={AppDevelopmentPage} />
      <Route
        path="/ffm/missions/app-development"
        component={AppDevelopmentPage}
      />
      {/* Ali's Additions */}
      <Route path="/ai-poll/control" component={AIPollControl} />
      <Route path="/ai-poll/:identifier" component={AIPollVote} />

      <Route path="/admin/media-assets" component={MediaAssetsControl} />
      <Route path="/gallery101" component={MediaAssetsGallery} />

      <Route path="/video-library/admin" component={VideoLibraryAdmin} />
      <Route path="/video-library/:code" component={VideoLibrary} />

      <Route path="/text-library-admin" component={TextLibraryAdmin} />
      <Route path="/text-library/:code" component={TextLibrary} />
      {/* ################# Application Development Routes ########################## */}
      <Route
        path="/missions/app-development/frontend-foundation"
        component={FrontendFoundation}
      />
      <Route
        path="/missions/app-development/frontend-foundation/inputs-outputs"
        component={InputsOutputsPlayground}
      />
      <Route
        path="/missions/app-development/frontend-foundation/buttons-events"
        component={ButtonsEventsPlayground}
      />
      <Route
        path="/missions/app-development/frontend-foundation/random-selection"
        component={RandomSelectionPlayground}
      />
      <Route
        path="/missions/app-development/frontend-foundation/conditional-logic"
        component={ConditionalLogicPlayground}
      />
      <Route
        path="/missions/app-development/frontend-foundation/layout-design"
        component={LayoutDesignPlayground}
      />
      <Route
        path="/missions/app-development/frontend-foundation/dynamic-images"
        component={DynamicImagesPlayground}
      />

      <Route
        path="/missions/app-development/frontend-foundation/final-project"
        component={FinalProjectPlayground}
      />

      <Route
        path="/missions/app-development/frontend-foundation/submissions"
        component={FrontendSubmissionsPage}
      />

      <Route
        path="/missions/app-development/frontend-foundation/projects/:projectId"
        component={FrontendProjectViewerPage}
      />

      <Route
        path="/missions/app-development/dynamic-interaction-media"
        component={DynamicInteractionMedia}
      />
      <Route
        path="/missions/app-development/dynamic-interaction-media/multi-inputs"
        component={MultiInputsPlayground}
      />
      <Route
        path="/missions/app-development/dynamic-interaction-media/navigation"
        component={NavigationPlayground}
      />
      <Route
        path="/missions/app-development/dynamic-interaction-media/embedded-media"
        component={EmbeddedMediaPlayground}
      />
      <Route
        path="/missions/app-development/dynamic-interaction-media/local-state"
        component={LocalStatePlayground}
      />
      <Route
        path="/missions/app-development/backend-ai-integration"
        component={BackendAiIntegration}
      />

      <Route
        path="/missions/app-development/backend-ai-integration/external-apis"
        component={ExternalApisPlayground}
      />
      <Route
        path="/missions/app-development/backend-ai-integration/openai"
        component={OpenAIPlayground}
      />
      <Route
        path="/missions/app-development/backend-ai-integration/persistence"
        component={PersistencePlayground}
      />
      <Route
        path="/missions/app-development/backend-ai-integration/auth-personalization"
        component={AuthPersonalizationPlayground}
      />
      {/* ################################# Application Development Routes ########################## */}
      {/* VideoGeneratorChatMissionPage */}

      {/* ################################# Video Generation Routes ########################## */}

      <Route
        path="/missions/video-generation/chat"
        component={VideoGeneratorChatMissionPage}
      />

      <Route
        path="/missions/video-generation/storyboard"
        component={ChatPage}
      />

      <Route
        path="/missions/video-generation/generate-image"
        component={ImageGenerationPage}
      />

      <Route
        path="/missions/video-generation/scene-flow"
        component={SceneFlowPage}
      />

      {/* ################################# Video Generation Routes ########################## */}

      <Route path="/mission1" component={Mission1} />
      <Route path="/mission1/stage/:stageName" component={Mission1} />
      <Route path="/game/mission:id" component={GameMission} />
      <Route path="/project/:projectId" component={Project} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/app-builder" component={AppBuilderStream} />
      <Route path="/missions/empty" component={EmptyMission} />
      <Route path="/missions/game-dev" component={GameDevMission} />
      <Route
        path="/missions/app-builder-activity"
        component={AppBuilderActivity}
      />
      <Route path="/missions/lovables" component={LovablesActivity} />
      <Route path="/missions/old-lovable" component={LovableMission} />
      <Route
        path="/missions/old-lovable/submissions"
        component={LovableSubmissionsPage}
      />

      <Route
        path="/missions/lovable"
        component={() => (
          <LovableAuthProvider>
            <LovableMissionPage />
          </LovableAuthProvider>
        )}
      />
      <Route
        path="/missions/lovable/submissions"
        component={LovableSubmissionsPage}
      />

      <Route path="/missions/lovable/v2" component={LovableMissionPageV2} />

      {/* <Route path="/missions/videos" component={VideoPage} />
      <Route path="/missions/videos/:videoId" component={VideoPlayer} /> */}

      <Route path="/missions/videos" component={VideosHomePage} />
      <Route
        path="/missions/videos/:categorySlug/:videoSlug"
        component={VideoPlayerPage}
      />

      <Route path="/video-submissions" component={VideoSubmissionsPage} />
      <Route path="/video" component={YouTubeVideoPage} />

      {/* <Route
        path="/missions/html-projects/submissions"
        component={HtmlProjectsList}
      /> */}
      <Route path="/reset-instructions" component={ResetInstructions} />
      {/* Standalone HTML Generator */}
      <Route path="/missions/html-generator" component={HTMLGeneratorWrapper} />
      {/* Standalone HTML Generator */}
      <Route path="/missions/html-generator-v2" component={HTMLGeneratorV2} />
      {/* <Route path="/missions/html-generator-v2/submissions" component={HtmlGeneratorV2SubmissionsPage} /> */}
      <Route path="/reset" component={ResetSession} />
      <Route path="/reset-intro" component={ResetIntro} />
      <Route path="/full-reset" component={ClientReset} />

      {/* <Route path="/admin/gallery" component={GalleryManagerPage} /> */}

      {/* ########################## admin routes ############################# */}
      <Route path="/admin/:rest*" component={AdminApp} />
      <Route path="/admin" component={AdminApp} />
      {/* ########################## admin routes ############################# */}

      {/* ########################## admin routes ############################# */}
      <Route
        path="/genai-school-training-registeration"
        component={GenaiSchoolTrainingPage}
      />
      {/* ########################## admin routes ############################# */}
      <Route path="/analytics" component={SubmissionsDashboard} />
      <Route
        path="/project-submissions-gallery"
        component={() => <ProjectSubmissionsGallery />}
      />

      <Route path="/missions/clips" component={ClipsMissionPage} />
      <Route
        path="missions/clips/submissions"
        component={ClipsSubmissionsPage}
      />

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
