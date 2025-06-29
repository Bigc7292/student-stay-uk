
import React, { useState } from 'react';
import { Home, AlertTriangle, CheckCircle, Clock, Calendar, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MaintenanceManager = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: 'Leaky bathroom tap',
      description: 'The tap in the main bathroom has been dripping constantly for 3 days',
      category: 'Plumbing',
      urgency: 'Medium',
      status: 'In Progress',
      dateSubmitted: '2024-06-15',
      expectedCompletion: '2024-06-20',
      aiPriority: 7
    },
    {
      id: 2,
      title: 'Heating not working',
      description: 'Central heating system not turning on, room temperature very cold',
      category: 'Heating',
      urgency: 'High',
      status: 'Scheduled',
      dateSubmitted: '2024-06-18',
      expectedCompletion: '2024-06-19',
      aiPriority: 9
    },
    {
      id: 3,
      title: 'Broken light bulb in kitchen',
      description: 'Main ceiling light not working, needs replacement',
      category: 'Electrical',
      urgency: 'Low',
      status: 'Completed',
      dateSubmitted: '2024-06-10',
      expectedCompletion: '2024-06-12',
      aiPriority: 3
    }
  ]);

  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    urgency: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmitRequest = () => {
    if (!newRequest.title || !newRequest.description || !newRequest.category || !newRequest.urgency) {
      alert('Please fill in all fields');
      return;
    }

    // AI Priority calculation simulation
    const aiPriority = newRequest.urgency === 'High' ? 8 + Math.floor(Math.random() * 2) :
                      newRequest.urgency === 'Medium' ? 5 + Math.floor(Math.random() * 3) :
                      2 + Math.floor(Math.random() * 3);

    const request = {
      id: requests.length + 1,
      ...newRequest,
      status: 'Submitted',
      dateSubmitted: new Date().toISOString().split('T')[0],
      expectedCompletion: new Date(Date.now() + (aiPriority > 7 ? 2 : aiPriority > 5 ? 5 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aiPriority
    };

    setRequests([request, ...requests]);
    setNewRequest({ title: '', description: '', category: '', urgency: '' });
    setShowNewRequest(false);
  };

  const stats = {
    total: requests.length,
    inProgress: requests.filter(r => r.status === 'In Progress' || r.status === 'Scheduled').length,
    completed: requests.filter(r => r.status === 'Completed').length,
    avgResponseTime: '2.3 days'
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Management</h1>
        <p className="text-gray-600 mb-4">AI-powered maintenance request system with smart prioritization</p>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Home className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Request Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maintenance Requests</h2>
        <Button onClick={() => setShowNewRequest(!showNewRequest)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* New Request Form */}
      {showNewRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Maintenance Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Issue Title</label>
                <Input
                  placeholder="Brief description of the problem"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={newRequest.category} onValueChange={(value) => setNewRequest({...newRequest, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Heating">Heating</SelectItem>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Urgency Level</label>
              <Select value={newRequest.urgency} onValueChange={(value) => setNewRequest({...newRequest, urgency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low - Can wait a week</SelectItem>
                  <SelectItem value="Medium">Medium - Should be fixed soon</SelectItem>
                  <SelectItem value="High">High - Urgent, affects daily life</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Detailed Description</label>
              <Textarea
                placeholder="Please provide detailed information about the issue, including when it started, any attempts to fix it, and how it affects your daily life..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleSubmitRequest}>Submit Request</Button>
              <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prioritization Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">AI Prioritization System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 text-sm mb-3">
            Our AI system automatically prioritizes maintenance requests based on urgency, safety implications, 
            and impact on daily life. High-priority issues are fast-tracked for same-day or next-day resolution.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-red-600">High Priority (8-10)</div>
              <div className="text-gray-600">Safety issues, heating/cooling failures</div>
              <div className="text-xs text-gray-500">Target: Same day response</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-yellow-600">Medium Priority (5-7)</div>
              <div className="text-gray-600">Plumbing leaks, appliance issues</div>
              <div className="text-xs text-gray-500">Target: 2-3 day response</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-semibold text-green-600">Low Priority (1-4)</div>
              <div className="text-gray-600">Cosmetic issues, minor repairs</div>
              <div className="text-xs text-gray-500">Target: 5-7 day response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.sort((a, b) => b.aiPriority - a.aiPriority).map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency} Priority
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Category: {request.category}</span>
                    <span>•</span>
                    <span>Submitted: {request.dateSubmitted}</span>
                    <span>•</span>
                    <span>Expected completion: {request.expectedCompletion}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">AI Priority Score</div>
                    <div className={`text-lg font-bold ${
                      request.aiPriority >= 8 ? 'text-red-600' : 
                      request.aiPriority >= 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {request.aiPriority}/10
                    </div>
                  </div>
                  {request.status === 'Scheduled' && (
                    <div className="flex items-center space-x-1 text-sm text-blue-600">
                      <Calendar className="w-4 h-4" />
                      <span>Visit scheduled</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Contact */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Emergency Contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-red-700">Emergency Maintenance</div>
              <div className="text-red-600">24/7 Hotline: 0800-EMERGENCY</div>
              <div className="text-xs text-red-500">For gas leaks, electrical faults, water damage, security issues</div>
            </div>
            <div>
              <div className="font-semibold text-red-700">Property Management</div>
              <div className="text-red-600">Office Hours: 0161-XXX-XXXX</div>
              <div className="text-xs text-red-500">Monday-Friday 9:00-17:00</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceManager;
