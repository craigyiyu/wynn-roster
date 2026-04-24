import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import ExceptionCenter from "./pages/ExceptionCenter";
import TeamProfiles from "./pages/TeamProfiles";
import RulesConstraints from "./pages/RulesConstraints";
import ApprovalCenter from "./pages/ApprovalCenter";
import DataIntake from "./pages/DataIntake";
import ETLNormalization from "./pages/ETLNormalization";
import AIExtractionReview from "./pages/AIExtractionReview";
import RosterGenerationFlow from "./pages/RosterGenerationFlow";
import DemandSkills from "./pages/DemandSkills";
import RotationView from "./pages/RotationView";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/schedule"} component={ScheduleBuilder} />
        <Route path={"/exceptions"} component={ExceptionCenter} />
        <Route path={"/team"} component={TeamProfiles} />
        <Route path={"/rules"} component={RulesConstraints} />
        <Route path={"/approvals"} component={ApprovalCenter} />
        <Route path={"/intake"} component={DataIntake} />
        <Route path={"/etl"} component={ETLNormalization} />
        <Route path={"/extraction"} component={AIExtractionReview} />
        <Route path={"/generation"} component={RosterGenerationFlow} />
        <Route path={"/demand"} component={DemandSkills} />
        <Route path={"/rotation"} component={RotationView} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
