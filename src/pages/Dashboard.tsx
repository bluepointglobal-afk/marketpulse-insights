import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Plus, 
  BarChart3, 
  Clock, 
  MoreVertical,
  Trash2,
  Eye,
  FileDown,
  LogOut,
  User,
  Settings,
  CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import { sampleTest, TestResults } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestResults[]>([sampleTest]);
  
  const user = {
    name: "John Doe",
    email: "john@example.com",
    credits: 0,
    tier: "PRO" as const,
    totalCredits: 10
  };

  const handleDelete = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">MarketPulse</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Credits */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {user.credits} / {user.totalCredits} credits
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => navigate("/auth")}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credits Banner */}
        {user.credits === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl gradient-bg text-primary-foreground"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold">You're out of credits</p>
                <p className="text-sm text-primary-foreground/80">
                  Upgrade to Pro to get 10 analyses per month
                </p>
              </div>
              <Button variant="secondary" className="shrink-0">
                Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Market Validations</h1>
            <p className="text-muted-foreground">
              Create and manage your product validation analyses
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/dashboard/test/new">
              <Plus className="w-4 h-4" />
              New Analysis
            </Link>
          </Button>
        </div>

        {/* Test List */}
        {tests.length > 0 ? (
          <div className="grid gap-4">
            {tests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="metric-card"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Test Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{test.productName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'COMPLETED' 
                          ? 'bg-green/10 text-green' 
                          : test.status === 'GENERATING'
                          ? 'bg-orange/10 text-orange'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {test.status === 'COMPLETED' ? '✓ Completed' : 
                         test.status === 'GENERATING' ? '⏳ Generating' : test.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(test.createdAt)}
                      </span>
                      <span>{test.category.replace('_', ' ')}</span>
                      <span>{test.targetMarket.join(', ')}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  {test.status === 'COMPLETED' && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold gradient-text">
                          {Math.round(test.bayesianResults.demandProbability * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Demand</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {test.bayesianResults.psmScore}
                        </p>
                        <p className="text-xs text-muted-foreground">PSM</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {test.bayesianResults.optimalPrice}
                        </p>
                        <p className="text-xs text-muted-foreground">SAR</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/test/${test.id}/results`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/test/${test.id}/results`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(test.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-glow">
              <BarChart3 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No validations yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first market validation analysis to get Bayesian insights for your product idea.
            </p>
            <Button variant="gradient" size="lg" asChild>
              <Link to="/dashboard/test/new">
                <Plus className="w-4 h-4" />
                Get Started
              </Link>
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
