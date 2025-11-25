import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import Workflows from './pages/Workflows';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import EmailInbox from './pages/EmailInbox';
import AgentDetail from './pages/AgentDetail';
import WorkflowEditor from './pages/WorkflowEditor';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import AgentTemplates from './pages/AgentTemplates';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import ClientWorkspace from './pages/ClientWorkspace';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import ContentLibrary from './pages/ContentLibrary';
import ContentDetail from './pages/ContentDetail';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Reports from './pages/Reports';
import Boards from './pages/Boards';
import BoardDetail from './pages/BoardDetail';
import WorkflowBuilder from './pages/WorkflowBuilder';
import AgentPerformanceHub from './pages/AgentPerformanceHub';
import AgentTuningWorkflow from './pages/AgentTuningWorkflow';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Documentation from './pages/Documentation';
import Support from './pages/Support';
import ApiDocs from './pages/ApiDocs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Agents": Agents,
    "Tasks": Tasks,
    "Workflows": Workflows,
    "Automations": Automations,
    "Analytics": Analytics,
    "Integrations": Integrations,
    "Settings": Settings,
    "Workspaces": Workspaces,
    "Projects": Projects,
    "EmailInbox": EmailInbox,
    "AgentDetail": AgentDetail,
    "WorkflowEditor": WorkflowEditor,
    "Landing": Landing,
    "Onboarding": Onboarding,
    "AgentTemplates": AgentTemplates,
    "AdminPanel": AdminPanel,
    "Profile": Profile,
    "Leads": Leads,
    "LeadDetail": LeadDetail,
    "ClientWorkspace": ClientWorkspace,
    "Contacts": Contacts,
    "ContactDetail": ContactDetail,
    "Deals": Deals,
    "DealDetail": DealDetail,
    "ContentLibrary": ContentLibrary,
    "ContentDetail": ContentDetail,
    "Campaigns": Campaigns,
    "CampaignDetail": CampaignDetail,
    "Reports": Reports,
    "Boards": Boards,
    "BoardDetail": BoardDetail,
    "WorkflowBuilder": WorkflowBuilder,
    "AgentPerformanceHub": AgentPerformanceHub,
    "AgentTuningWorkflow": AgentTuningWorkflow,
    "Login": Login,
    "Signup": Signup,
    "ForgotPassword": ForgotPassword,
    "ResetPassword": ResetPassword,
    "Documentation": Documentation,
    "Support": Support,
    "ApiDocs": ApiDocs,
    "Terms": Terms,
    "Privacy": Privacy,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};