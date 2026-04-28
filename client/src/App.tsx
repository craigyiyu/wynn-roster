import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import ETLNormalization from "./pages/ETLNormalization";
import AIExtractionReview from "./pages/AIExtractionReview";
import RosterGenerationFlow from "./pages/RosterGenerationFlow";
import DemandSkills from "./pages/DemandSkills";
import RotationView from "./pages/RotationView";
import DataLineage from "./pages/DataLineage";
import EmployeeTrace from "./pages/EmployeeTrace";
import RosterValidation from "./pages/RosterValidation";
import RuleStudio from "./pages/RuleStudio";
import DataIntake from "./pages/DataIntake";
import APITest from "./pages/APITest";
import ExceptionCenter from "./pages/ExceptionCenter";
import TeamProfiles from "./pages/TeamProfiles";
import RulesConstraints from "./pages/RulesConstraints";
import ExportPanel from "./pages/ExportPanel";
import ApprovalCenter from "./pages/ApprovalCenter";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/schedule" component={ScheduleBuilder} />
        <Route path="/intake" component={DataIntake} />
        <Route path="/api-test" component={APITest} />
        <Route path="/exceptions" component={ExceptionCenter} />
        <Route path="/team" component={TeamProfiles} />
        <Route path="/rules" component={RulesConstraints} />
        <Route path="/export" component={ExportPanel} />
        <Route path="/etl" component={ETLNormalization} />
        <Route path="/ai-review" component={AIExtractionReview} />
        <Route path="/generation" component={RosterGenerationFlow} />
        <Route path="/demand" component={DemandSkills} />
        <Route path="/rotation" component={RotationView} />
        <Route path="/lineage" component={DataLineage} />
        <Route path="/trace" component={EmployeeTrace} />
        <Route path="/validation" component={RosterValidation} />
        <Route path="/studio" component={RuleStudio} />
        <Route path="/approvals" component={ApprovalCenter} />
        <Route path="/404" component={NotFound} />
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
