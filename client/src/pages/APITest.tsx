/*
 * API Test Page - Demonstrates backend connectivity
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function APITest() {
  const [health, setHealth] = useState<any>(null);
  const [constraints, setConstraints] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const h = await api.health();
      setHealth(h);
      const c = await api.constraints();
      setConstraints(c);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { testAPI(); }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wynn Roster API Test</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Backend Health</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : health ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : <p>No response</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Schedule Constraints</CardTitle></CardHeader>
          <CardContent>
            {constraints ? (
              <div className="space-y-2">
                <p><strong>RDO Employees:</strong> {constraints.rdo?.activeCount}</p>
                <p><strong>Special Requests:</strong> {constraints.specialRequest?.activeCount}</p>
                <p><strong>EVES Employees:</strong> {constraints.eves?.activeCount}</p>
              </div>
            ) : <p>Loading...</p>}
          </CardContent>
        </Card>

        <Button onClick={testAPI}>Refresh</Button>
      </div>
    </div>
  );
}
