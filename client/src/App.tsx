import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import Home from "@/pages/home";
import Project from "@/pages/project";

function Router() {
  // Set the HTML dir and lang attributes for RTL support
  useEffect(() => {
    document.documentElement.dir = "ltr"; // Changed to LTR for wider compatibility
    document.documentElement.lang = "en"; // Changed to English for wider compatibility
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/project/:projectId" component={Project} />
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
