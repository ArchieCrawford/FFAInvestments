import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, TrendingUp, DollarSign, ArrowRight, 
  BookOpen, Bell, Activity, ChevronRight 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function MemberDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: accountUsers = [] } = useQuery({
    queryKey: ['my-accounts', user?.email],
    queryFn: () => base44.entities.AccountUser.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-detail', accountUsers],
    queryFn: async () => {
      const accountIds = accountUsers.map(au => au.account_id);
      if (accountIds.length === 0) return [];
      const allAccounts = await base44.entities.Account.list();
      return allAccounts.filter(acc => accountIds.includes(acc.id));
    },
    enabled: accountUsers.length > 0,
  });

  const { data: unitPrices = [] } = useQuery({
    queryKey: ['unit-prices'],
    queryFn: () => base44.entities.UnitPrice.list('-price_date', 30),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 3),
  });

  const { data: educationProgress = [] } = useQuery({
    queryKey: ['education-progress', user?.email],
    queryFn: () => base44.entities.EducationProgress.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const latestUnitPrice = unitPrices[0];
  const totalValue = accounts.reduce((sum, acc) => 
    sum + (acc.current_units * (latestUnitPrice?.price || 0)), 0
  );
  const totalUnits = accounts.reduce((sum, acc) => sum + acc.current_units, 0);
  const completedLessons = educationProgress.filter(p => p.status === 'completed').length;

  const chartData = unitPrices.slice(0, 30).reverse().map(up => ({
    date: format(new Date(up.price_date), 'MMM dd'),
    price: up.price,
  }));

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-default mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-muted">Here's your investment portfolio overview</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-900 to-blue-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium opacity-90">Total Portfolio Value</CardTitle>
                <Wallet className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm opacity-75">{totalUnits.toFixed(4)} units</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">Current Unit Price</CardTitle>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default mb-1">
                ${latestUnitPrice?.price?.toFixed(4) || '0.00'}
              </div>
              <p className="text-sm text-muted">
                {latestUnitPrice?.price_date ? format(new Date(latestUnitPrice.price_date), 'MMM dd, yyyy') : '-'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">Education Progress</CardTitle>
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default mb-1">
                {completedLessons}
              </div>
              <p className="text-sm text-muted">lessons completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Unit Price Chart */}
        {chartData.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-default">Unit Price History (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`$${value.toFixed(4)}`, 'Unit Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#1e40af" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Accounts */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-default">My Accounts</CardTitle>
              <Link to={createPageUrl("MemberAccounts")}>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.length === 0 ? (
                <p className="text-muted text-center py-8">No accounts assigned yet</p>
              ) : (
                accounts.map(account => {
                  const accountValue = account.current_units * (latestUnitPrice?.price || 0);
                  return (
                    <Link 
                      key={account.id}
                      to={`${createPageUrl("MemberAccountDetail")}?id=${account.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-blue-300 hover:bg-primary-soft transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-default">{account.name}</p>
                            <p className="text-sm text-muted">{account.current_units.toFixed(4)} units</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-default">
                            ${accountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-default">Recent Announcements</CardTitle>
              <Link to={createPageUrl("Announcements")}>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-muted text-center py-8">No announcements</p>
              ) : (
                announcements.map(announcement => (
                  <div 
                    key={announcement.id}
                    className="p-4 rounded-lg border border-border hover:bg-bg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-default mb-1">{announcement.title}</h4>
                        <p className="text-sm text-muted line-clamp-2">
                          {announcement.body_markdown}
                        </p>
                        {announcement.created_date && (
                          <p className="text-xs text-muted mt-2">
                            {format(new Date(announcement.created_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}