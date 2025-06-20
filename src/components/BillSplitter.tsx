
import React, { useState } from 'react';
import { PoundSterling, Users, Calculator, CreditCard, Receipt, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const BillSplitter = () => {
  const [bills, setBills] = useState([
    {
      id: 1,
      name: 'Monthly Rent',
      amount: 800,
      type: 'fixed',
      dueDate: '2024-07-01',
      status: 'pending',
      splitType: 'equal',
      paidBy: []
    },
    {
      id: 2,
      name: 'Electricity Bill',
      amount: 120,
      type: 'utility',
      dueDate: '2024-06-25',
      status: 'pending',
      splitType: 'usage',
      paidBy: []
    },
    {
      id: 3,
      name: 'Internet',
      amount: 35,
      type: 'utility',
      dueDate: '2024-06-28',
      status: 'paid',
      splitType: 'equal',
      paidBy: ['John', 'Sarah', 'Mike', 'Emma']
    }
  ]);

  const [housemates, setHousemates] = useState([
    { name: 'John', email: 'john@email.com', share: 25 },
    { name: 'Sarah', email: 'sarah@email.com', share: 25 },
    { name: 'Mike', email: 'mike@email.com', share: 25 },
    { name: 'Emma', email: 'emma@email.com', share: 25 }
  ]);

  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    type: 'utility',
    dueDate: '',
    splitType: 'equal'
  });

  const [showNewBill, setShowNewBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const calculateSplit = (bill: any) => {
    const amount = bill.amount;
    const numHousemates = housemates.length;
    
    if (bill.splitType === 'equal') {
      return amount / numHousemates;
    } else if (bill.splitType === 'usage') {
      // Simulate usage-based calculation
      return housemates.map(h => (amount * h.share) / 100);
    }
    return amount / numHousemates;
  };

  const addNewBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;

    const bill = {
      id: bills.length + 1,
      ...newBill,
      amount: parseFloat(newBill.amount),
      status: 'pending',
      paidBy: []
    };

    setBills([bill, ...bills]);
    setNewBill({ name: '', amount: '', type: 'utility', dueDate: '', splitType: 'equal' });
    setShowNewBill(false);
  };

  const markAsPaid = (billId: number, personName: string) => {
    setBills(bills.map(bill => {
      if (bill.id === billId) {
        const newPaidBy = bill.paidBy.includes(personName) 
          ? bill.paidBy.filter(name => name !== personName)
          : [...bill.paidBy, personName];
        
        return {
          ...bill,
          paidBy: newPaidBy,
          status: newPaidBy.length === housemates.length ? 'paid' : 'pending'
        };
      }
      return bill;
    }));
  };

  const totalOwed = bills
    .filter(bill => bill.status === 'pending')
    .reduce((sum, bill) => sum + calculateSplit(bill), 0);

  const monthlyTotal = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Bill Splitter</h1>
        <p className="text-gray-600 mb-4">AI-powered bill management and fair payment splitting for shared accommodation</p>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Total</p>
                  <p className="text-2xl font-bold">£{monthlyTotal}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Share</p>
                  <p className="text-2xl font-bold">£{(monthlyTotal / housemates.length).toFixed(2)}</p>
                </div>
                <PoundSterling className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">£{totalOwed.toFixed(2)}</p>
                </div>
                <Calculator className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Housemates</p>
                  <p className="text-2xl font-bold">{housemates.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add New Bill */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bills & Expenses</h2>
        <Button onClick={() => setShowNewBill(!showNewBill)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {showNewBill && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bill Name</label>
                <Input
                  placeholder="e.g., Electricity, Water, Internet"
                  value={newBill.name}
                  onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (£)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bill Type</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={newBill.type}
                  onChange={(e) => setNewBill({...newBill, type: e.target.value})}
                >
                  <option value="utility">Utility</option>
                  <option value="fixed">Fixed Cost</option>
                  <option value="shared">Shared Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <Input
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Split Method</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={newBill.splitType}
                onChange={(e) => setNewBill({...newBill, splitType: e.target.value})}
              >
                <option value="equal">Equal Split</option>
                <option value="usage">Usage-Based</option>
                <option value="custom">Custom Split</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <Button onClick={addNewBill}>Add Bill</Button>
              <Button variant="outline" onClick={() => setShowNewBill(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">AI Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-blue-700">Budget Analysis</div>
              <div className="text-blue-600">15% below average for your area</div>
              <div className="text-xs text-blue-500">You're saving £127/month compared to similar properties</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-blue-700">Seasonal Prediction</div>
              <div className="text-blue-600">Winter bills likely +25%</div>
              <div className="text-xs text-blue-500">Expect heating costs to increase in December-February</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-blue-700">Payment Pattern</div>
              <div className="text-blue-600">Most bills paid on time</div>
              <div className="text-xs text-blue-500">Great payment history builds trust with housemates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="space-y-4">
        {bills.map((bill) => (
          <Card key={bill.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{bill.name}</h3>
                    <Badge className={bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {bill.status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                    <Badge variant="outline">{bill.type}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>Total: £{bill.amount}</span>
                    <span>•</span>
                    <span>Per person: £{calculateSplit(bill).toFixed ? calculateSplit(bill).toFixed(2) : (calculateSplit(bill) as number[])[0]?.toFixed(2)}</span>
                    <span>•</span>
                    <span>Due: {bill.dueDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">£{bill.amount}</div>
                  <div className="text-sm text-gray-500">{bill.splitType} split</div>
                </div>
              </div>

              {/* Payment Status by Housemate */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {housemates.map((housemate) => (
                  <div key={housemate.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{housemate.name}</span>
                    <Button
                      size="sm"
                      variant={bill.paidBy.includes(housemate.name) ? "default" : "outline"}
                      onClick={() => markAsPaid(bill.id, housemate.name)}
                      className="h-6"
                    >
                      {bill.paidBy.includes(housemate.name) ? '✓' : '○'}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm text-gray-600">
                Paid by: {bill.paidBy.length}/{housemates.length} housemates
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Integration */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Integrated Payments</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Direct bank transfers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>PayPal integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automatic reminders</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Smart Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automatic bill splitting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Usage tracking for utilities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Spending analytics</span>
                </div>
              </div>
            </div>
          </div>
          <Button className="w-full mt-4">Connect Payment Method</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillSplitter;
