import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Mission1 from "@/pages/mission1";
import Project from "@/pages/project";
import Gallery from "@/pages/gallery";
import ResetInstructions from "@/pages/reset-instructions";
import { ResetSession } from "@/components/ResetSession";

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
      <Route path="/project/:projectId" component={Project} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/reset-instructions" component={ResetInstructions} />
      <Route path="/reset" component={ResetSession} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
