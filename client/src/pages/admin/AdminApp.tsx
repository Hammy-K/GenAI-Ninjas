import { AdminAuthProvider } from "@/hooks/auth/AdminAuthProvider";
import { RequireAdmin } from "@/guards/RequireAdmin";
import { Switch, Route, Router } from "wouter";
import AdminLayout from "./AdminLayout";
import DashboardPage from "./DashboardPage";
import { useEffect } from "react";
import { useLocation } from "wouter";
// import HtmlGamesProjectsPage from "./HtmlGamesProjectsPage";
import HtmlGamesExportPage from "./HtmlGamesExportPage";

function AdminIndexRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/admin/dashboard");
  }, [navigate]);

  return null;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <RequireAdmin>
        <AdminLayout>
          <Router base="/admin">
            <Switch>
              <Route path="/" component={AdminIndexRedirect} />
              <Route path="/dashboard" component={DashboardPage} />
              {/* <Route
                path="/html-games-projects"
                component={HtmlGamesProjectsPage}
              /> */}
              <Route
                path="/html-games-projects"
                component={HtmlGamesExportPage}
              />
              <Route>
                <div className="p-6">Admin page not found</div>
              </Route>
            </Switch>
          </Router>
        </AdminLayout>
      </RequireAdmin>
    </AdminAuthProvider>
  );
}
