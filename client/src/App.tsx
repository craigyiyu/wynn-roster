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
import RuleStudio from "./pages/RuleStudio";
import ApprovalCenter from "./pages/ApprovalCenter";
import DataIntake from "./pages/DataIntake";
import ETLNormalization from "./pages/ETLNormalization";
import AIExtractionReview from "./pages/AIExtractionReview";
import RosterGenerationFlow from "./pages/RosterGenerationFlow";
import DemandSkills from "./pages/DemandSkills";
import RotationView from "./pages/RotationView";
import DataLineage from "./pages/DataLineage";
import RosterValidation from "./pages/RosterValidation";
import EmployeeTrace from "./pages/EmployeeTrace";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/schedule"} component={ScheduleBuilder} />
        <Route path={"/exceptions"} component={ExceptionCenter} />
        <Route path={"/team"} component={TeamProfiles} />
        <Route path={"/rules"} component={RuleStudio} />
        <Route path={"/approvals"} component={ApprovalCenter} />
        <Route path={"/intake"} component={DataIntake} />
        <Route path={"/etl"} component={ETLNormalization} />
        <Route path={"/extraction"} component={AIExtractionReview} />
        <Route path={"/generation"} component={RosterGenerationFlow} />
        <Route path={"/demand"} component={DemandSkills} />
        <Route path={"/rotation"} component={RotationView} />
        <Route path={"/lineage"} component={DataLineage} />
        <Route path={"/validation"} component={RosterValidation} />
        <Route path={"/trace"} component={EmployeeTrace} />
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
